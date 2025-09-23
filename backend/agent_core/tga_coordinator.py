"""
TGA Coordinator Agent - Zentrale Steuerung des Multi-Agent-Workflows
für die automatische Plan- und Dokumentenprüfung
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import json
from datetime import datetime

# Logging konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProjectType(Enum):
    """Gebäudetypen für spezifische TGA-Anforderungen"""
    RESIDENTIAL = "wohngebaeude"
    OFFICE = "buerogebaeude"
    INDUSTRIAL = "industriebau"
    HOSPITAL = "krankenhaus"
    SCHOOL = "schule"
    MIXED_USE = "mischnutzung"

class LeistungsPhase(Enum):
    """HOAI Leistungsphasen"""
    LP1 = "grundlagenermittlung"
    LP2 = "vorplanung"
    LP3 = "entwurfsplanung"
    LP4 = "genehmigungsplanung"
    LP5 = "ausfuehrungsplanung"
    LP6 = "vorbereitung_vergabe"
    LP7 = "mitwirken_vergabe"
    LP8 = "objektueberwachung"
    LP9 = "objektbetreuung"

class GewerkeType(Enum):
    """TGA-Gewerke nach KG400"""
    KG410_SANITAER = "kg410_sanitaer"
    KG420_HEIZUNG = "kg420_heizung"
    KG430_LUEFTUNG = "kg430_lueftung"
    KG440_ELEKTRO = "kg440_elektro"
    KG450_KOMMUNIKATION = "kg450_kommunikation"
    KG474_FEUERLOESCHUNG = "kg474_feuerloeschung"
    KG480_AUTOMATION = "kg480_automation"

@dataclass
class Document:
    """Repräsentiert ein TGA-Planungsdokument"""
    id: str
    filename: str
    file_path: str
    document_type: str  # "plan", "berechnung", "schema", "bericht"
    gewerk: GewerkeType
    leistungsphase: LeistungsPhase
    plan_nummer: Optional[str] = None
    revision: Optional[str] = None
    erstellt_am: Optional[datetime] = None
    metadaten: Dict[str, Any] = None

@dataclass
class Finding:
    """Repräsentiert einen Prüfbefund"""
    id: str
    document_id: str
    gewerk: GewerkeType
    kategorie: str  # "formal", "technisch", "koordination"
    prioritaet: str  # "hoch", "mittel", "niedrig"
    titel: str
    beschreibung: str
    agent_quelle: str
    konfidenz_score: float = 0.0
    norm_referenz: Optional[str] = None
    plan_referenz: Optional[str] = None
    empfehlung: Optional[str] = None

@dataclass
class PruefAuftrag:
    """Repräsentiert einen Prüfauftrag"""
    id: str
    projekt_name: str
    projekt_typ: ProjectType
    leistungsphase: LeistungsPhase
    dokumente: List[Document]
    erstellt_am: datetime
    status: str = "erstellt"  # "erstellt", "laufend", "abgeschlossen", "fehler"

class TGACoordinator:
    """
    Zentraler Coordinator für den TGA-Planprüfungs-Workflow
    """
    
    def __init__(self):
        self.aktive_auftraege: Dict[str, PruefAuftrag] = {}
        self.ergebnisse: Dict[str, List[Finding]] = {}
        
    async def starte_pruefung(self, auftrag: PruefAuftrag) -> str:
        """
        Startet eine neue TGA-Planprüfung
        
        Args:
            auftrag: Der Prüfauftrag mit allen Dokumenten
            
        Returns:
            str: Auftrag-ID für Statusabfragen
        """
        logger.info(f"Starte Prüfung für Projekt: {auftrag.projekt_name}")
        
        # Auftrag registrieren
        self.aktive_auftraege[auftrag.id] = auftrag
        auftrag.status = "laufend"
        
        try:
            # 1. Dokumente klassifizieren und validieren
            await self._klassifiziere_dokumente(auftrag)
            
            # 2. Formale Prüfung starten
            formale_befunde = await self._starte_formale_pruefung(auftrag)
            
            # 3. Gewerkespezifische Fachprüfung
            fach_befunde = await self._starte_fachpruefung(auftrag)
            
            # 4. Gewerkeübergreifende Koordinationsprüfung
            koordinations_befunde = await self._starte_koordinationspruefung(auftrag)
            
            # 5. Ergebnisse zusammenführen und bewerten
            alle_befunde = formale_befunde + fach_befunde + koordinations_befunde
            bewertete_befunde = await self._bewerte_befunde(alle_befunde)
            
            # 6. Ergebnisse speichern
            self.ergebnisse[auftrag.id] = bewertete_befunde
            auftrag.status = "abgeschlossen"
            
            logger.info(f"Prüfung abgeschlossen. {len(bewertete_befunde)} Befunde gefunden.")
            return auftrag.id
            
        except Exception as e:
            logger.error(f"Fehler bei Prüfung: {str(e)}")
            auftrag.status = "fehler"
            raise
    
    async def _klassifiziere_dokumente(self, auftrag: PruefAuftrag):
        """Klassifiziert und validiert die eingereichten Dokumente"""
        logger.info("Klassifiziere Dokumente...")
        
        for dokument in auftrag.dokumente:
            # Hier würde die Document Intake Agent Logik implementiert
            logger.info(f"Klassifiziere: {dokument.filename}")
            
            # Metadaten aus Planköpfen extrahieren
            await self._extrahiere_metadaten(dokument)
            
            # Planlisten-Abgleich
            await self._pruefe_planliste(dokument, auftrag)
    
    async def _extrahiere_metadaten(self, dokument: Document):
        """Extrahiert Metadaten aus Planköpfen und Deckblättern"""
        # Hier würde OCR/PDF-Parsing implementiert
        logger.info(f"Extrahiere Metadaten aus: {dokument.filename}")
        
        # Placeholder für Metadaten-Extraktion
        dokument.metadaten = {
            "plan_nummer": "TGA-001",
            "revision": "Rev. 01",
            "massstab": "1:100",
            "erstellt_von": "Planungsbüro XY",
            "geprueft_von": "Ing. Mustermann",
            "datum": "2024-01-15"
        }
    
    async def _pruefe_planliste(self, dokument: Document, auftrag: PruefAuftrag):
        """Prüft Dokument gegen Planliste auf Vollständigkeit"""
        logger.info(f"Prüfe Planliste für: {dokument.filename}")
        # Hier würde Planlisten-Abgleich implementiert
    
    async def _starte_formale_pruefung(self, auftrag: PruefAuftrag) -> List[Finding]:
        """Startet die formale Prüfung nach VDI 6026 und anderen Normen"""
        logger.info("Starte formale Prüfung...")
        
        befunde = []
        
        for dokument in auftrag.dokumente:
            # Formal Compliance Agent würde hier aufgerufen
            dokument_befunde = await self._pruefe_vdi_6026_konformitaet(dokument, auftrag)
            befunde.extend(dokument_befunde)
        
        return befunde
    
    async def _pruefe_vdi_6026_konformitaet(self, dokument: Document, auftrag: PruefAuftrag) -> List[Finding]:
        """Prüft VDI 6026 Konformität"""
        befunde = []
        
        # Beispiel-Prüfung: Vollständigkeit der Legende
        if dokument.document_type == "plan":
            # Hier würde echte Legende-Prüfung implementiert
            befund = Finding(
                id=f"formal_{dokument.id}_001",
                document_id=dokument.id,
                gewerk=dokument.gewerk,
                kategorie="formal",
                prioritaet="mittel",
                titel="Legende unvollständig",
                beschreibung="Nicht alle verwendeten Symbole sind in der Legende erklärt",
                norm_referenz="VDI 6026",
                plan_referenz=dokument.filename,
                empfehlung="Legende um fehlende Symbole ergänzen",
                agent_quelle="formal_compliance_agent",
                konfidenz_score=0.85
            )
            befunde.append(befund)
        
        return befunde
    
    async def _starte_fachpruefung(self, auftrag: PruefAuftrag) -> List[Finding]:
        """Startet die gewerkespezifische Fachprüfung"""
        logger.info("Starte Fachprüfung...")
        
        befunde = []
        
        # Gruppiere Dokumente nach Gewerk
        gewerke_dokumente = {}
        for dokument in auftrag.dokumente:
            if dokument.gewerk not in gewerke_dokumente:
                gewerke_dokumente[dokument.gewerk] = []
            gewerke_dokumente[dokument.gewerk].append(dokument)
        
        # Starte parallele Prüfung für jedes Gewerk
        tasks = []
        for gewerk, dokumente in gewerke_dokumente.items():
            task = self._pruefe_gewerk(gewerk, dokumente, auftrag)
            tasks.append(task)
        
        # Warte auf alle Gewerk-Prüfungen
        gewerk_ergebnisse = await asyncio.gather(*tasks)
        
        # Sammle alle Befunde
        for ergebnis in gewerk_ergebnisse:
            befunde.extend(ergebnis)
        
        return befunde
    
    async def _pruefe_gewerk(self, gewerk: GewerkeType, dokumente: List[Document], auftrag: PruefAuftrag) -> List[Finding]:
        """Prüft ein spezifisches Gewerk"""
        logger.info(f"Prüfe Gewerk: {gewerk.value}")
        
        befunde = []
        
        # Hier würden die Trade-Specific Expert Agents aufgerufen
        if gewerk == GewerkeType.KG420_HEIZUNG:
            befunde.extend(await self._pruefe_heizung(dokumente, auftrag))
        elif gewerk == GewerkeType.KG430_LUEFTUNG:
            befunde.extend(await self._pruefe_lueftung(dokumente, auftrag))
        elif gewerk == GewerkeType.KG410_SANITAER:
            befunde.extend(await self._pruefe_sanitaer(dokumente, auftrag))
        # ... weitere Gewerke
        
        return befunde
    
    async def _pruefe_heizung(self, dokumente: List[Document], auftrag: PruefAuftrag) -> List[Finding]:
        """Spezifische Heizungsprüfung"""
        befunde = []
        
        # Beispiel: Heizlastberechnung prüfen
        for dokument in dokumente:
            if "heizlast" in dokument.filename.lower():
                befund = Finding(
                    id=f"heizung_{dokument.id}_001",
                    document_id=dokument.id,
                    gewerk=GewerkeType.KG420_HEIZUNG,
                    kategorie="technisch",
                    prioritaet="hoch",
                    titel="Heizlastberechnung nach DIN EN 12831-1 prüfen",
                    beschreibung="Heizlastberechnung muss auf Vollständigkeit und Plausibilität geprüft werden",
                    norm_referenz="DIN EN 12831-1",
                    plan_referenz=dokument.filename,
                    empfehlung="Heizlastberechnung durch Fachplaner validieren lassen",
                    agent_quelle="heizung_expert_agent",
                    konfidenz_score=0.90
                )
                befunde.append(befund)
        
        return befunde
    
    async def _pruefe_lueftung(self, dokumente: List[Document], auftrag: PruefAuftrag) -> List[Finding]:
        """Spezifische Lüftungsprüfung"""
        befunde = []
        
        # Gebäudetypspezifische Prüfung
        if auftrag.projekt_typ == ProjectType.OFFICE:
            # Bürogebäude: Mindestluftwechsel prüfen
            befund = Finding(
                id=f"lueftung_buero_001",
                document_id="",
                gewerk=GewerkeType.KG430_LUEFTUNG,
                kategorie="technisch",
                prioritaet="hoch",
                titel="Mindestluftwechsel Bürogebäude",
                beschreibung="Mindestluftwechsel 4-6 m³/(h·Person) nach ASR A3.6 prüfen",
                norm_referenz="ASR A3.6, VDI 6040",
                empfehlung="Luftmengenberechnung auf Einhaltung der Mindestanforderungen prüfen",
                agent_quelle="lueftung_expert_agent",
                konfidenz_score=0.95
            )
            befunde.append(befund)
        
        return befunde
    
    async def _pruefe_sanitaer(self, dokumente: List[Document], auftrag: PruefAuftrag) -> List[Finding]:
        """Spezifische Sanitärprüfung"""
        befunde = []
        
        # Beispiel: Trinkwasserverordnung
        befund = Finding(
            id=f"sanitaer_001",
            document_id="",
            gewerk=GewerkeType.KG410_SANITAER,
            kategorie="technisch",
            prioritaet="hoch",
            titel="Trinkwasserverordnung beachten",
            beschreibung="Einhaltung der Trinkwasserverordnung bei Leitungsführung und Materialwahl prüfen",
            norm_referenz="TrinkwV, DIN EN 806",
            empfehlung="Materialien und Leitungsführung auf TrinkwV-Konformität prüfen",
            agent_quelle="sanitaer_expert_agent",
            konfidenz_score=0.88
        )
        befunde.append(befund)
        
        return befunde
    
    async def _starte_koordinationspruefung(self, auftrag: PruefAuftrag) -> List[Finding]:
        """Startet die gewerkeübergreifende Koordinationsprüfung"""
        logger.info("Starte Koordinationsprüfung...")
        
        befunde = []
        
        # Cross-Discipline Coordination Agent würde hier aufgerufen
        befunde.extend(await self._pruefe_kollisionen(auftrag))
        befunde.extend(await self._pruefe_schnittstellen(auftrag))
        befunde.extend(await self._pruefe_sud_planung(auftrag))
        
        return befunde
    
    async def _pruefe_kollisionen(self, auftrag: PruefAuftrag) -> List[Finding]:
        """Prüft auf geometrische Kollisionen zwischen Gewerken"""
        befunde = []
        
        # Beispiel-Kollisionsprüfung
        befund = Finding(
            id="kollision_001",
            document_id="",
            gewerk=GewerkeType.KG430_LUEFTUNG,
            kategorie="koordination",
            prioritaet="hoch",
            titel="Potenzielle Kollision Lüftungskanal/Elektrotrasse",
            beschreibung="Lüftungskanal und Elektrotrasse kreuzen sich im gleichen Höhenniveau",
            plan_referenz="Koordinationsplan EG",
            empfehlung="Höhenkoordination zwischen Lüftung und Elektro abstimmen",
            agent_quelle="coordination_agent",
            konfidenz_score=0.75
        )
        befunde.append(befund)
        
        return befunde
    
    async def _pruefe_schnittstellen(self, auftrag: PruefAuftrag) -> List[Finding]:
        """Prüft Schnittstellen zwischen Gewerken"""
        befunde = []
        
        # Beispiel: Heizung-Elektro Schnittstelle
        befund = Finding(
            id="schnittstelle_001",
            document_id="",
            gewerk=GewerkeType.KG420_HEIZUNG,
            kategorie="koordination",
            prioritaet="mittel",
            titel="Elektrische Anschlussleistung Wärmepumpe",
            beschreibung="Anschlussleistung der Wärmepumpe muss mit Elektroplanung abgestimmt werden",
            empfehlung="Lastangaben zwischen Heizung und Elektro abstimmen",
            agent_quelle="coordination_agent",
            konfidenz_score=0.92
        )
        befunde.append(befund)
        
        return befunde
    
    async def _pruefe_sud_planung(self, auftrag: PruefAuftrag) -> List[Finding]:
        """Prüft Schlitz- und Durchbruchsplanung"""
        befunde = []
        
        befund = Finding(
            id="sud_001",
            document_id="",
            gewerk=GewerkeType.KG410_SANITAER,
            kategorie="koordination",
            prioritaet="hoch",
            titel="SuD-Planung unvollständig",
            beschreibung="Schlitz- und Durchbruchsplanung für Sanitärleitungen fehlt",
            empfehlung="SuD-Pläne erstellen und mit Tragwerksplanung abstimmen",
            agent_quelle="coordination_agent",
            konfidenz_score=0.88
        )
        befunde.append(befund)
        
        return befunde
    
    async def _bewerte_befunde(self, befunde: List[Finding]) -> List[Finding]:
        """Bewertet und priorisiert die gefundenen Befunde"""
        logger.info(f"Bewerte {len(befunde)} Befunde...")
        
        # Sortiere nach Priorität und Konfidenz
        bewertete_befunde = sorted(befunde, 
                                 key=lambda x: (
                                     {"hoch": 3, "mittel": 2, "niedrig": 1}[x.prioritaet],
                                     x.konfidenz_score
                                 ), 
                                 reverse=True)
        
        return bewertete_befunde
    
    def get_status(self, auftrag_id: str) -> Dict[str, Any]:
        """Gibt den Status eines Prüfauftrags zurück"""
        if auftrag_id not in self.aktive_auftraege:
            return {"error": "Auftrag nicht gefunden"}
        
        auftrag = self.aktive_auftraege[auftrag_id]
        ergebnisse = self.ergebnisse.get(auftrag_id, [])
        
        return {
            "auftrag_id": auftrag_id,
            "projekt_name": auftrag.projekt_name,
            "status": auftrag.status,
            "anzahl_dokumente": len(auftrag.dokumente),
            "anzahl_befunde": len(ergebnisse),
            "befunde_nach_prioritaet": {
                "hoch": len([b for b in ergebnisse if b.prioritaet == "hoch"]),
                "mittel": len([b for b in ergebnisse if b.prioritaet == "mittel"]),
                "niedrig": len([b for b in ergebnisse if b.prioritaet == "niedrig"])
            }
        }
    
    def get_ergebnisse(self, auftrag_id: str) -> List[Dict[str, Any]]:
        """Gibt die Prüfergebnisse zurück"""
        if auftrag_id not in self.ergebnisse:
            return []
        
        befunde = self.ergebnisse[auftrag_id]
        return [
            {
                "id": befund.id,
                "gewerk": befund.gewerk.value,
                "kategorie": befund.kategorie,
                "prioritaet": befund.prioritaet,
                "titel": befund.titel,
                "beschreibung": befund.beschreibung,
                "norm_referenz": befund.norm_referenz,
                "plan_referenz": befund.plan_referenz,
                "empfehlung": befund.empfehlung,
                "konfidenz_score": befund.konfidenz_score
            }
            for befund in befunde
        ]

