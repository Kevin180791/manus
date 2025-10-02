"""
TGA Router - API-Endpunkte für die TGA-Planprüfung
"""

import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from typing import List, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
from datetime import datetime
import os
import shutil

from agent_core.tga_coordinator import (
    TGACoordinator,
    PruefAuftrag,
    Document,
    ProjectType,
    LeistungsPhase,
    GewerkeType
)

from database import get_db

router = APIRouter()

# Globale Instanz des TGA Coordinators
tga_coordinator = TGACoordinator()

logger = logging.getLogger(__name__)

# Pydantic Models für API
class ProjectRequest(BaseModel):
    projekt_name: str
    projekt_typ: ProjectType
    leistungsphase: LeistungsPhase
    beschreibung: Optional[str] = None

class DocumentInfo(BaseModel):
    filename: str
    document_type: str
    gewerk: GewerkeType
    plan_nummer: Optional[str] = None
    revision: Optional[str] = None

class PruefungStartRequest(BaseModel):
    projekt: ProjectRequest
    dokumente: List[DocumentInfo]

@router.post("/projekte/erstellen")
async def erstelle_projekt(projekt: ProjectRequest):
    """
    Erstellt ein neues TGA-Projekt
    """
    projekt_id = str(uuid.uuid4())
    
    return {
        "projekt_id": projekt_id,
        "projekt_name": projekt.projekt_name,
        "projekt_typ": projekt.projekt_typ.value,
        "leistungsphase": projekt.leistungsphase.value,
        "status": "erstellt",
        "erstellt_am": datetime.now().isoformat()
    }

@router.post("/dokumente/upload/{projekt_id}")
async def upload_dokument(
    projekt_id: str,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    gewerk: str = Form(...),
    plan_nummer: Optional[str] = Form(None),
    revision: Optional[str] = Form(None)
):
    """
    Lädt ein TGA-Dokument hoch
    """
    try:
        # Validiere Gewerk
        gewerk_enum = GewerkeType(gewerk)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Ungültiges Gewerk: {gewerk}")
    
    # Erstelle Upload-Verzeichnis falls nicht vorhanden
    upload_dir = f"uploads/{projekt_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Speichere Datei
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Erstelle Document-Objekt
    dokument = Document(
        id=str(uuid.uuid4()),
        filename=file.filename,
        file_path=file_path,
        document_type=document_type,
        gewerk=gewerk_enum,
        leistungsphase=LeistungsPhase.LP3,  # Default, wird später klassifiziert
        plan_nummer=plan_nummer,
        revision=revision,
        erstellt_am=datetime.now()
    )
    
    return {
        "dokument_id": dokument.id,
        "filename": dokument.filename,
        "gewerk": dokument.gewerk.value,
        "document_type": dokument.document_type,
        "status": "hochgeladen"
    }

@router.post("/pruefung/starten/{projekt_id}")
async def starte_pruefung(
    projekt_id: str,
    request: PruefungStartRequest
):
    """
    Startet eine TGA-Planprüfung für ein Projekt
    """
    try:
        # Erstelle Dokument-Objekte
        dokumente = []
        upload_dir = f"uploads/{projekt_id}"
        
        for doc_info in request.dokumente:
            file_path = os.path.join(upload_dir, doc_info.filename)
            if not os.path.exists(file_path):
                raise HTTPException(
                    status_code=404, 
                    detail=f"Datei nicht gefunden: {doc_info.filename}"
                )
            
            dokument = Document(
                id=str(uuid.uuid4()),
                filename=doc_info.filename,
                file_path=file_path,
                document_type=doc_info.document_type,
                gewerk=doc_info.gewerk,
                leistungsphase=request.projekt.leistungsphase,
                plan_nummer=doc_info.plan_nummer,
                revision=doc_info.revision,
                erstellt_am=datetime.now()
            )
            dokumente.append(dokument)
        
        # Erstelle Prüfauftrag
        auftrag = PruefAuftrag(
            id=str(uuid.uuid4()),
            projekt_name=request.projekt.projekt_name,
            projekt_typ=request.projekt.projekt_typ,
            leistungsphase=request.projekt.leistungsphase,
            dokumente=dokumente,
            erstellt_am=datetime.now()
        )
        
        # Starte Prüfung asynchron
        auftrag_id = await tga_coordinator.starte_pruefung(auftrag)
        
        return {
            "auftrag_id": auftrag_id,
            "projekt_id": projekt_id,
            "status": "gestartet",
            "anzahl_dokumente": len(dokumente),
            "geschaetzte_dauer": "5-15 Minuten"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pruefung/status/{auftrag_id}")
async def get_pruefung_status(auftrag_id: str):
    """
    Gibt den Status einer laufenden Prüfung zurück
    """
    status = tga_coordinator.get_status(auftrag_id)
    
    if "error" in status:
        raise HTTPException(status_code=404, detail=status["error"])
    
    return status

@router.get("/pruefung/ergebnisse/{auftrag_id}")
async def get_pruefung_ergebnisse(auftrag_id: str):
    """
    Gibt die Prüfergebnisse zurück
    """
    ergebnisse = tga_coordinator.get_ergebnisse(auftrag_id)
    
    if not ergebnisse:
        # Prüfe ob Auftrag existiert
        status = tga_coordinator.get_status(auftrag_id)
        if "error" in status:
            raise HTTPException(status_code=404, detail="Auftrag nicht gefunden")
        
        return {
            "auftrag_id": auftrag_id,
            "status": status["status"],
            "befunde": [],
            "message": "Prüfung noch nicht abgeschlossen oder keine Befunde gefunden"
        }
    
    return {
        "auftrag_id": auftrag_id,
        "anzahl_befunde": len(ergebnisse),
        "befunde": ergebnisse
    }

@router.get("/gewerke")
async def get_verfuegbare_gewerke():
    """
    Gibt alle verfügbaren TGA-Gewerke zurück
    """
    return {
        "gewerke": [
            {
                "code": gewerk.value,
                "name": gewerk.name,
                "beschreibung": _get_gewerk_beschreibung(gewerk)
            }
            for gewerk in GewerkeType
        ]
    }

@router.get("/projekt-typen")
async def get_projekt_typen():
    """
    Gibt alle verfügbaren Projekttypen zurück
    """
    return {
        "projekt_typen": [
            {
                "code": typ.value,
                "name": typ.name,
                "beschreibung": _get_projekt_typ_beschreibung(typ)
            }
            for typ in ProjectType
        ]
    }

@router.get("/leistungsphasen")
async def get_leistungsphasen():
    """
    Gibt alle HOAI-Leistungsphasen zurück
    """
    return {
        "leistungsphasen": [
            {
                "code": phase.value,
                "name": phase.name,
                "beschreibung": _get_leistungsphase_beschreibung(phase)
            }
            for phase in LeistungsPhase
        ]
    }

def _get_gewerk_beschreibung(gewerk: GewerkeType) -> str:
    """Gibt eine Beschreibung für ein Gewerk zurück"""
    beschreibungen = {
        GewerkeType.KG410_SANITAER: "Abwasser-, Wasser- und Gasanlagen",
        GewerkeType.KG420_HEIZUNG: "Wärmeversorgungsanlagen",
        GewerkeType.KG430_LUEFTUNG: "Raumlufttechnische Anlagen",
        GewerkeType.KG440_ELEKTRO: "Elektrische Anlagen",
        GewerkeType.KG450_KOMMUNIKATION: "Kommunikations- und sicherheitstechnische Anlagen",
        GewerkeType.KG474_FEUERLOESCHUNG: "Feuerlöschanlagen",
        GewerkeType.KG480_AUTOMATION: "Gebäudeautomation"
    }
    return beschreibungen.get(gewerk, "")

def _get_projekt_typ_beschreibung(typ: ProjectType) -> str:
    """Gibt eine Beschreibung für einen Projekttyp zurück"""
    beschreibungen = {
        ProjectType.RESIDENTIAL: "Wohngebäude und Wohnanlagen",
        ProjectType.OFFICE: "Bürogebäude und Verwaltungsbauten",
        ProjectType.INDUSTRIAL: "Industriebauten und Produktionsstätten",
        ProjectType.HOSPITAL: "Krankenhäuser und Gesundheitseinrichtungen",
        ProjectType.SCHOOL: "Schulen und Bildungseinrichtungen",
        ProjectType.MIXED_USE: "Mischnutzung und Sonderbauten"
    }
    return beschreibungen.get(typ, "")

def _get_leistungsphase_beschreibung(phase: LeistungsPhase) -> str:
    """Gibt eine Beschreibung für eine Leistungsphase zurück"""
    beschreibungen = {
        LeistungsPhase.LP1: "Grundlagenermittlung (2%)",
        LeistungsPhase.LP2: "Vorplanung (9%)",
        LeistungsPhase.LP3: "Entwurfsplanung (15%)",
        LeistungsPhase.LP4: "Genehmigungsplanung (3%)",
        LeistungsPhase.LP5: "Ausführungsplanung (25%)",
        LeistungsPhase.LP6: "Vorbereitung der Vergabe (10%)",
        LeistungsPhase.LP7: "Mitwirken bei der Vergabe (4%)",
        LeistungsPhase.LP8: "Objektüberwachung (32%)",
        LeistungsPhase.LP9: "Objektbetreuung und Dokumentation (2%)"
    }
    return beschreibungen.get(phase, "")



@router.get("/pruefung/bericht/{auftrag_id}")
async def generiere_pruefbericht(
    auftrag_id: str,
    download: bool = False,
    db: Session = Depends(get_db)
):
    """Gibt Berichtsdaten zurück und bietet optional einen PDF-Download an."""
    try:
        status = tga_coordinator.get_status(auftrag_id)
        if "error" in status:
            raise HTTPException(status_code=404, detail="Auftrag nicht gefunden")

        ergebnisse = tga_coordinator.get_ergebnisse(auftrag_id) or []

        if download:
            from services.bericht_service import BerichtService

            bericht_service = BerichtService(db)

            existing_path = bericht_service.hole_bericht_pfad(auftrag_id)
            if existing_path:
                return FileResponse(
                    existing_path,
                    media_type="application/pdf",
                    filename=f"pruefbericht_{auftrag_id}.pdf"
                )

            bericht_path = bericht_service.generiere_pruefbericht(auftrag_id)
            if not bericht_path:
                raise HTTPException(
                    status_code=404,
                    detail="Prüfauftrag nicht gefunden oder Bericht konnte nicht erstellt werden"
                )

            return FileResponse(
                bericht_path,
                media_type="application/pdf",
                filename=f"pruefbericht_{auftrag_id}.pdf"
            )

        bericht_data = {
            "auftrag_id": auftrag_id,
            "projekt_name": status.get("projekt_name"),
            "erstellt_am": datetime.now().isoformat(),
            "zusammenfassung": {
                "anzahl_dokumente": status.get("anzahl_dokumente"),
                "anzahl_befunde": status.get("anzahl_befunde"),
                "befunde_nach_prioritaet": status.get("befunde_nach_prioritaet")
            },
            "befunde": ergebnisse
        }

        if not ergebnisse:
            bericht_data["status"] = status.get("status")
            bericht_data["message"] = (
                "Prüfung noch nicht abgeschlossen oder keine Befunde gefunden"
            )

        return bericht_data

    except HTTPException:
        raise
    except Exception:
        logger.exception("Fehler bei Berichtsgenerierung")
        raise HTTPException(status_code=500, detail="Interner Serverfehler")

