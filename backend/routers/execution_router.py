"""
API Router für ausführende Firmen
Endpoints für Ausführungsreife-Prüfung und Materiallisten
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import logging
import os
import tempfile

from database import get_db
from models import Projekt, Dokument, Befund, PruefAuftrag
from models_execution import (
    AusfuehrungsReifePruefung,
    FehlendesDokument,
    MaterialListe,
    MaterialPosition,
    AusfuehrungsStatusEnum
)
from agent_core.execution_readiness_agent import ExecutionReadinessAgent
from services.material_list_service import MaterialListService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/execution",
    tags=["execution"]
)

# Pydantic Models für Request/Response
class ExecutionReadinessRequest(BaseModel):
    projekt_id: str

class ExecutionReadinessResponse(BaseModel):
    id: str
    projekt_id: str
    status: str
    gesamt_score: float
    vollstaendigkeit_score: float
    detailgrad_score: float
    materialspezifikation_score: float
    schnittstellen_score: float
    empfehlung: str
    naechste_schritte: List[dict]
    anzahl_kritische_befunde: int
    anzahl_fehlende_dokumente: int
    erstellt_am: datetime

class MaterialListRequest(BaseModel):
    projekt_id: str
    gewerk: str
    use_llm: bool = False

class MaterialListResponse(BaseModel):
    id: str
    projekt_id: str
    gewerk: str
    anzahl_positionen: int
    erstellt_am: datetime
    erstellt_von: str

class MaterialPositionResponse(BaseModel):
    id: str
    kategorie: str
    bezeichnung: str
    menge: float
    einheit: str
    abmessungen: Optional[str]
    material: Optional[str]
    hersteller: Optional[str]
    typ: Optional[str]
    quelle_plan_referenz: Optional[str]
    konfidenz: float


# Endpoints

@router.post("/readiness-check", response_model=ExecutionReadinessResponse)
async def check_execution_readiness(
    request: ExecutionReadinessRequest,
    db: Session = Depends(get_db)
):
    """
    Prüft die Ausführungsreife eines Projekts
    
    Diese Endpoint führt eine umfassende Prüfung durch, ob die Planungsunterlagen
    ausreichend detailliert und vollständig sind, um mit der Ausführung zu beginnen.
    """
    logger.info(f"Ausführungsreife-Prüfung angefordert für Projekt {request.projekt_id}")
    
    # Projekt laden
    projekt = db.query(Projekt).filter(Projekt.id == request.projekt_id).first()
    if not projekt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Projekt {request.projekt_id} nicht gefunden"
        )
    
    # Dokumente laden
    dokumente = db.query(Dokument).filter(Dokument.projekt_id == request.projekt_id).all()
    
    # Befunde laden (aus letztem Prüfauftrag)
    letzter_auftrag = db.query(PruefAuftrag).filter(
        PruefAuftrag.projekt_id == request.projekt_id
    ).order_by(PruefAuftrag.erstellt_am.desc()).first()
    
    befunde = []
    if letzter_auftrag:
        befunde = db.query(Befund).filter(
            Befund.pruefauftrag_id == letzter_auftrag.id
        ).all()
    
    # Daten für Agent vorbereiten
    projekt_data = {
        "id": projekt.id,
        "name": projekt.name,
        "typ": projekt.typ.value if projekt.typ else "OFFICE",
        "leistungsphase": projekt.leistungsphase.value if projekt.leistungsphase else "LP5"
    }
    
    dokumente_data = [
        {
            "id": d.id,
            "filename": d.filename,
            "document_type": d.document_type,
            "gewerk": d.gewerk.value if d.gewerk else "UNKNOWN",
            "metadaten": {
                "extrahierter_text": d.metadaten.extrahierter_text if d.metadaten else ""
            }
        }
        for d in dokumente
    ]
    
    befunde_data = [
        {
            "id": b.id,
            "beschreibung": b.beschreibung,
            "prioritaet": b.prioritaet.value if b.prioritaet else "NIEDRIG",
            "kategorie": b.kategorie.value if b.kategorie else "FORMAL"
        }
        for b in befunde
    ]
    
    # Agent ausführen
    agent = ExecutionReadinessAgent()
    result = agent.pruefe_ausfuehrungsreife(projekt_data, dokumente_data, befunde_data)
    
    # Ergebnis in Datenbank speichern
    pruefung = AusfuehrungsReifePruefung(
        projekt_id=request.projekt_id,
        status=AusfuehrungsStatusEnum[result["status"].upper()],
        vollstaendigkeit_score=result["scores"]["vollstaendigkeit"],
        detailgrad_score=result["scores"]["detailgrad"],
        materialspezifikation_score=result["scores"]["materialspezifikation"],
        schnittstellen_score=result["scores"]["schnittstellen"],
        gesamt_score=result["gesamt_score"],
        empfehlung=result["empfehlung"],
        naechste_schritte=result["naechste_schritte"],
        anzahl_kritische_befunde=len([b for b in befunde if b.prioritaet.value == "HOCH"]),
        anzahl_fehlende_dokumente=len(result["details"]["vollstaendigkeit"]["fehlende_dokumente"]),
        geprueft_von=agent.name
    )
    
    db.add(pruefung)
    db.commit()
    db.refresh(pruefung)
    
    # Fehlende Dokumente speichern
    for fehlendes_dok in result["details"]["vollstaendigkeit"]["fehlende_dokumente"]:
        fehlendes = FehlendesDokument(
            pruefung_id=pruefung.id,
            dokument_typ=fehlendes_dok["dokument_typ"],
            gewerk=fehlendes_dok["gewerk"],
            beschreibung=f"{fehlendes_dok['dokument_typ']} fehlt für Gewerk {fehlendes_dok['gewerk']}",
            prioritaet=fehlendes_dok["prioritaet"],
            grund=fehlendes_dok["grund"]
        )
        db.add(fehlendes)
    
    db.commit()
    
    logger.info(f"Ausführungsreife-Prüfung abgeschlossen: {pruefung.id}, Status: {pruefung.status.value}")
    
    # Response
    return ExecutionReadinessResponse(
        id=pruefung.id,
        projekt_id=pruefung.projekt_id,
        status=pruefung.status.value,
        gesamt_score=pruefung.gesamt_score,
        vollstaendigkeit_score=pruefung.vollstaendigkeit_score,
        detailgrad_score=pruefung.detailgrad_score,
        materialspezifikation_score=pruefung.materialspezifikation_score,
        schnittstellen_score=pruefung.schnittstellen_score,
        empfehlung=pruefung.empfehlung,
        naechste_schritte=pruefung.naechste_schritte,
        anzahl_kritische_befunde=pruefung.anzahl_kritische_befunde,
        anzahl_fehlende_dokumente=pruefung.anzahl_fehlende_dokumente,
        erstellt_am=pruefung.erstellt_am
    )


@router.get("/readiness-check/{projekt_id}", response_model=ExecutionReadinessResponse)
async def get_latest_readiness_check(
    projekt_id: str,
    db: Session = Depends(get_db)
):
    """
    Liefert die letzte Ausführungsreife-Prüfung für ein Projekt
    """
    pruefung = db.query(AusfuehrungsReifePruefung).filter(
        AusfuehrungsReifePruefung.projekt_id == projekt_id
    ).order_by(AusfuehrungsReifePruefung.erstellt_am.desc()).first()
    
    if not pruefung:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Keine Ausführungsreife-Prüfung für Projekt {projekt_id} gefunden"
        )
    
    return ExecutionReadinessResponse(
        id=pruefung.id,
        projekt_id=pruefung.projekt_id,
        status=pruefung.status.value,
        gesamt_score=pruefung.gesamt_score,
        vollstaendigkeit_score=pruefung.vollstaendigkeit_score,
        detailgrad_score=pruefung.detailgrad_score,
        materialspezifikation_score=pruefung.materialspezifikation_score,
        schnittstellen_score=pruefung.schnittstellen_score,
        empfehlung=pruefung.empfehlung,
        naechste_schritte=pruefung.naechste_schritte,
        anzahl_kritische_befunde=pruefung.anzahl_kritische_befunde,
        anzahl_fehlende_dokumente=pruefung.anzahl_fehlende_dokumente,
        erstellt_am=pruefung.erstellt_am
    )


@router.post("/material-list", response_model=MaterialListResponse)
async def generate_material_list(
    request: MaterialListRequest,
    db: Session = Depends(get_db)
):
    """
    Generiert automatisch eine Materialliste für ein Gewerk
    
    Diese Endpoint extrahiert Materialien aus den Planungsunterlagen und erstellt
    eine strukturierte Liste für die Arbeitsvorbereitung (AVOR).
    """
    logger.info(f"Materialliste angefordert für Projekt {request.projekt_id}, Gewerk {request.gewerk}")
    
    # Projekt laden
    projekt = db.query(Projekt).filter(Projekt.id == request.projekt_id).first()
    if not projekt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Projekt {request.projekt_id} nicht gefunden"
        )
    
    # Dokumente des Gewerks laden
    dokumente = db.query(Dokument).filter(
        Dokument.projekt_id == request.projekt_id,
        Dokument.gewerk == request.gewerk
    ).all()
    
    if not dokumente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Keine Dokumente für Gewerk {request.gewerk} gefunden"
        )
    
    # Daten für Service vorbereiten
    dokumente_data = [
        {
            "id": d.id,
            "filename": d.filename,
            "gewerk": d.gewerk.value if d.gewerk else "UNKNOWN",
            "metadaten": {
                "extrahierter_text": d.metadaten.extrahierter_text if d.metadaten else ""
            }
        }
        for d in dokumente
    ]
    
    # Service ausführen
    service = MaterialListService()
    result = service.generiere_materialliste(
        projekt_id=request.projekt_id,
        gewerk=request.gewerk,
        dokumente=dokumente_data,
        use_llm=request.use_llm
    )
    
    # Ergebnis in Datenbank speichern
    material_liste = MaterialListe(
        projekt_id=request.projekt_id,
        gewerk=request.gewerk,
        erstellt_von=service.name
    )
    
    db.add(material_liste)
    db.commit()
    db.refresh(material_liste)
    
    # Positionen speichern
    for pos_data in result["positionen"]:
        position = MaterialPosition(
            liste_id=material_liste.id,
            kategorie=pos_data.get("kategorie"),
            bezeichnung=pos_data.get("bezeichnung"),
            menge=pos_data.get("menge"),
            einheit=pos_data.get("einheit"),
            abmessungen=pos_data.get("abmessungen"),
            material=pos_data.get("material"),
            hersteller=pos_data.get("hersteller"),
            typ=pos_data.get("typ"),
            quelle_dokument_id=pos_data.get("quelle_dokument_id"),
            quelle_plan_referenz=pos_data.get("quelle_plan_referenz"),
            extraktionsmethode=pos_data.get("extraktionsmethode"),
            konfidenz=pos_data.get("konfidenz", 0.0)
        )
        db.add(position)
    
    db.commit()
    
    logger.info(f"Materialliste erstellt: {material_liste.id}, {len(result['positionen'])} Positionen")
    
    return MaterialListResponse(
        id=material_liste.id,
        projekt_id=material_liste.projekt_id,
        gewerk=material_liste.gewerk,
        anzahl_positionen=len(result["positionen"]),
        erstellt_am=material_liste.erstellt_am,
        erstellt_von=material_liste.erstellt_von
    )


@router.get("/material-list/{liste_id}", response_model=List[MaterialPositionResponse])
async def get_material_list(
    liste_id: str,
    db: Session = Depends(get_db)
):
    """
    Liefert alle Positionen einer Materialliste
    """
    material_liste = db.query(MaterialListe).filter(MaterialListe.id == liste_id).first()
    
    if not material_liste:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Materialliste {liste_id} nicht gefunden"
        )
    
    positionen = db.query(MaterialPosition).filter(
        MaterialPosition.liste_id == liste_id
    ).all()
    
    return [
        MaterialPositionResponse(
            id=pos.id,
            kategorie=pos.kategorie.value if pos.kategorie else "SONSTIGES",
            bezeichnung=pos.bezeichnung,
            menge=pos.menge,
            einheit=pos.einheit,
            abmessungen=pos.abmessungen,
            material=pos.material,
            hersteller=pos.hersteller,
            typ=pos.typ,
            quelle_plan_referenz=pos.quelle_plan_referenz,
            konfidenz=pos.konfidenz
        )
        for pos in positionen
    ]


@router.get("/material-list/{liste_id}/export/csv")
async def export_material_list_csv(
    liste_id: str,
    db: Session = Depends(get_db)
):
    """
    Exportiert Materialliste als CSV
    """
    material_liste = db.query(MaterialListe).filter(MaterialListe.id == liste_id).first()
    
    if not material_liste:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Materialliste {liste_id} nicht gefunden"
        )
    
    positionen = db.query(MaterialPosition).filter(
        MaterialPosition.liste_id == liste_id
    ).all()
    
    # Daten für Export vorbereiten
    positionen_data = [
        {
            "kategorie": pos.kategorie.value if pos.kategorie else "SONSTIGES",
            "bezeichnung": pos.bezeichnung,
            "menge": pos.menge,
            "einheit": pos.einheit,
            "abmessungen": pos.abmessungen,
            "material": pos.material,
            "hersteller": pos.hersteller,
            "typ": pos.typ,
            "artikelnummer": pos.artikelnummer,
            "quelle_plan_referenz": pos.quelle_plan_referenz
        }
        for pos in positionen
    ]
    
    materialliste_data = {
        "projekt_id": material_liste.projekt_id,
        "gewerk": material_liste.gewerk,
        "positionen": positionen_data
    }
    
    # CSV erstellen
    service = MaterialListService()
    
    # Temporäre Datei
    temp_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv')
    csv_path = service.exportiere_csv(materialliste_data, temp_file.name)
    
    # CSV als Download zurückgeben
    filename = f"materialliste_{material_liste.gewerk}_{material_liste.erstellt_am.strftime('%Y%m%d')}.csv"
    
    return FileResponse(
        path=csv_path,
        filename=filename,
        media_type='text/csv'
    )

