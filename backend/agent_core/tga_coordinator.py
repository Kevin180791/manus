"""
TGA Coordinator Agent - Zentrale Steuerung des Multi-Agent-Workflows
für die automatische Plan- und Dokumentenprüfung
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Optional

from .checks.common import Finding as RuleFinding
from .document_parser import DocumentParser
from .heizung_expert import build_heating_context as build_heating_pipeline_context
from .lueftung_expert import build_ventilation_context as build_ventilation_pipeline_context
from .tga_pipeline import (
    run_pipeline_automation,
    run_pipeline_communication,
    run_pipeline_electrical,
    run_pipeline_fire_suppression,
    run_pipeline_heating,
    run_pipeline_sanitary,
    run_pipeline_ventilation,
)

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
        self._parser = DocumentParser()
        
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

        pipeline_dispatch = {
            GewerkeType.KG410_SANITAER: (self.build_sanitary_context, run_pipeline_sanitary),
            GewerkeType.KG420_HEIZUNG: (self.build_heating_context, run_pipeline_heating),
            GewerkeType.KG430_LUEFTUNG: (self.build_ventilation_context, run_pipeline_ventilation),
            GewerkeType.KG440_ELEKTRO: (self.build_electrical_context, run_pipeline_electrical),
            GewerkeType.KG450_KOMMUNIKATION: (self.build_communication_context, run_pipeline_communication),
            GewerkeType.KG474_FEUERLOESCHUNG: (self.build_fire_suppression_context, run_pipeline_fire_suppression),
            GewerkeType.KG480_AUTOMATION: (self.build_automation_context, run_pipeline_automation),
        }

        handler = pipeline_dispatch.get(gewerk)
        if handler is None:
            logger.warning("Keine Pipeline für Gewerk %s registriert", gewerk.value)
            return []

        builder, pipeline = handler
        context = await builder(dokumente, auftrag)
        context.setdefault("projekt_typ", auftrag.projekt_typ.value)

        rule_results = pipeline(context)
        dokument_index = {doc.id: doc for doc in dokumente}

        return [self._convert_rule_finding(result, gewerk, dokument_index) for result in rule_results]

    async def build_sanitary_context(
        self, dokumente: List[Document], auftrag: PruefAuftrag
    ) -> MutableMapping[str, Any]:
        context: MutableMapping[str, Any] = {
            "projekt_typ": auftrag.projekt_typ.value,
            "documents": [self._document_header(doc) for doc in dokumente],
            "systems": [],
            "fixtures": [],
        }

        for dokument in dokumente:
            text = self._extract_text(dokument.file_path)
            system_entry: MutableMapping[str, Any] = {
                "name": dokument.plan_nummer or dokument.filename,
                "dokument_id": dokument.id,
                "hot_water_temp": None,
                "circulation_temp": None,
                "velocities": {},
                "materials": {},
                "insulation": {},
            }

            if text:
                system_entry["hot_water_temp"] = self._find_first_float(
                    text,
                    [
                        r"Warmwassertemperatur[^\d]*(\d+[.,]?\d*)",
                        r"TWW[^\d]*(\d+[.,]?\d*)",
                    ],
                )
                system_entry["circulation_temp"] = self._find_first_float(
                    text,
                    [
                        r"Zirkulations(?:rücklauf|temperatur)[^\d]*(\d+[.,]?\d*)",
                        r"Zirkulation[^\d]*(\d+[.,]?\d*)\s*°?C",
                    ],
                )

                velocities: Dict[str, float] = {}
                for medium, patterns in {
                    "warmwasser": [r"Warmwasser[^\n]*?(\d+[.,]?\d*)\s*m/s", r"WW[^\n]*(\d+[.,]?\d*)\s*m/s"],
                    "kaltwasser": [r"Kaltwasser[^\n]*?(\d+[.,]?\d*)\s*m/s"],
                    "zirkulation": [r"Zirkulation[^\n]*?(\d+[.,]?\d*)\s*m/s"],
                    "abwasser": [r"Abwasser[^\n]*?(\d+[.,]?\d*)\s*m/s"],
                }.items():
                    value = self._find_first_float(text, patterns)
                    if value is not None:
                        velocities[medium] = value
                system_entry["velocities"] = velocities

                materials: Dict[str, str] = {}
                for medium, patterns in {
                    "warmwasser": [r"Warmwasser[^\n]*(Edelstahl|Kupfer|Stahl|Kunststoff)"],
                    "kaltwasser": [r"Kaltwasser[^\n]*(Edelstahl|Kupfer|Stahl|Kunststoff)"],
                }.items():
                    value = self._find_first_string(text, patterns)
                    if value:
                        materials[medium] = value
                system_entry["materials"] = materials

                insulation: Dict[str, float] = {}
                for medium, patterns in {
                    "warmwasser": [r"Warmwasser[^\n]*(\d+[.,]?\d*)\s*mm"],
                    "zirkulation": [r"Zirkulation[^\n]*(\d+[.,]?\d*)\s*mm"],
                }.items():
                    value = self._find_first_float(text, patterns)
                    if value is not None:
                        insulation[medium] = value
                system_entry["insulation"] = insulation

                fixtures = self._extract_sanitary_fixtures(text, dokument.id)
                if fixtures:
                    context["fixtures"].extend(fixtures)

            context["systems"].append(system_entry)

        return context

    async def build_heating_context(
        self, dokumente: List[Document], auftrag: PruefAuftrag
    ) -> MutableMapping[str, Any]:
        dokument_payload = [self._document_payload(doc) for doc in dokumente]
        context = await build_heating_pipeline_context(dokument_payload, auftrag.projekt_typ.value)
        context.setdefault("projekt_typ", auftrag.projekt_typ.value)
        return context

    async def build_ventilation_context(
        self, dokumente: List[Document], auftrag: PruefAuftrag
    ) -> MutableMapping[str, Any]:
        dokument_payload = [self._document_payload(doc) for doc in dokumente]
        context = await build_ventilation_pipeline_context(dokument_payload, auftrag.projekt_typ.value)
        context.setdefault("projekt_typ", auftrag.projekt_typ.value)
        return context

    async def build_electrical_context(
        self, dokumente: List[Document], auftrag: PruefAuftrag
    ) -> MutableMapping[str, Any]:
        context: MutableMapping[str, Any] = {
            "projekt_typ": auftrag.projekt_typ.value,
            "documents": [self._document_header(doc) for doc in dokumente],
            "stromkreise": [],
            "beleuchtung": [],
            "verbraucher": [],
            "notbeleuchtung": None,
        }

        for dokument in dokumente:
            text = self._extract_text(dokument.file_path)
            circuits = self._extract_electrical_circuits(text, dokument)
            if circuits:
                context["stromkreise"].extend(circuits)
            else:
                context["stromkreise"].append(
                    {
                        "id": dokument.id,
                        "name": dokument.plan_nummer or dokument.filename,
                        "dokument_id": dokument.id,
                    }
                )

            lighting = self._extract_lighting_zones(text, dokument)
            if lighting:
                context["beleuchtung"].extend(lighting)

            consumers = self._extract_electrical_consumers(text, dokument)
            if consumers:
                context["verbraucher"].extend(consumers)

            if context.get("notbeleuchtung") is None:
                if re.search(r"notbeleuchtung|sicherheitsbeleuchtung", text, re.IGNORECASE):
                    context["notbeleuchtung"] = True

        return context

    async def build_communication_context(
        self, dokumente: List[Document], auftrag: PruefAuftrag
    ) -> MutableMapping[str, Any]:
        context: MutableMapping[str, Any] = {
            "projekt_typ": auftrag.projekt_typ.value,
            "documents": [self._document_header(doc) for doc in dokumente],
            "datennetze": [],
            "brandmeldeanlage": {},
            "sicherheitsbereiche": [],
        }

        for dokument in dokumente:
            text = self._extract_text(dokument.file_path)
            networks = self._extract_networks(text, dokument)
            if networks:
                context["datennetze"].extend(networks)

            fire_alarm = self._extract_fire_alarm(text)
            if fire_alarm:
                context["brandmeldeanlage"].update(fire_alarm)

            security_areas = self._extract_security_areas(text, dokument)
            if security_areas:
                context["sicherheitsbereiche"].extend(security_areas)

        if (
            not context["datennetze"]
            and not context["brandmeldeanlage"]
            and not context["sicherheitsbereiche"]
        ):
            for dokument in dokumente:
                context["datennetze"].append(
                    {
                        "id": f"{dokument.id}_net_placeholder",
                        "zone": dokument.plan_nummer or dokument.filename,
                        "rack_belegung": None,
                        "kabelschirmung": None,
                        "dokument_id": dokument.id,
                    }
                )

        return context

    async def build_fire_suppression_context(
        self, dokumente: List[Document], auftrag: PruefAuftrag
    ) -> MutableMapping[str, Any]:
        context: MutableMapping[str, Any] = {
            "projekt_typ": auftrag.projekt_typ.value,
            "documents": [self._document_header(doc) for doc in dokumente],
            "sprinkler": [],
            "hydranten": [],
            "wasserversorgung": {},
        }

        for dokument in dokumente:
            text = self._extract_text(dokument.file_path)
            sprinkler = self._extract_sprinkler_zones(text, dokument)
            if sprinkler:
                context["sprinkler"].extend(sprinkler)

            hydrants = self._extract_hydrant_data(text, dokument)
            if hydrants:
                context["hydranten"].extend(hydrants)

            supply = self._extract_water_supply(text)
            if supply:
                context["wasserversorgung"].update(supply)

        if not context["sprinkler"] and not context["hydranten"]:
            for dokument in dokumente:
                context["sprinkler"].append(
                    {
                        "id": f"{dokument.id}_sprinkler_placeholder",
                        "name": dokument.plan_nummer or dokument.filename,
                        "gefährdungsklasse": "normal",
                        "dokument_id": dokument.id,
                    }
                )

        return context

    async def build_automation_context(
        self, dokumente: List[Document], auftrag: PruefAuftrag
    ) -> MutableMapping[str, Any]:
        context: MutableMapping[str, Any] = {
            "projekt_typ": auftrag.projekt_typ.value,
            "documents": [self._document_header(doc) for doc in dokumente],
            "systeme": [],
            "messstellen": [],
            "trendaufzeichnung_tage": None,
            "alarmreaktionszeit": None,
        }

        for dokument in dokumente:
            text = self._extract_text(dokument.file_path)
            systems = self._extract_automation_systems(text, dokument)
            if systems:
                context["systeme"].extend(systems)

            points = self._extract_automation_points(text, dokument)
            if points:
                context["messstellen"].extend(points)

            if context.get("trendaufzeichnung_tage") is None:
                trend = self._find_first_float(text, [r"Trend(?:aufzeichnung|speicher)[^\d]*(\d+[.,]?\d*)\s*Tage"])
                if trend is not None:
                    context["trendaufzeichnung_tage"] = trend

            if context.get("alarmreaktionszeit") is None:
                alarm = self._find_first_float(text, [r"Alarmreaktion[^\d]*(\d+[.,]?\d*)\s*s"])
                if alarm is not None:
                    context["alarmreaktionszeit"] = alarm

        return context

    def _convert_rule_finding(
        self,
        finding: RuleFinding,
        gewerk: GewerkeType,
        dokument_index: Mapping[str, Document],
    ) -> Finding:
        dokument_id = finding.dokument_id or ""
        if dokument_id:
            dokument_id = str(dokument_id)

        plan_ref = finding.plan_referenz
        if dokument_id and not plan_ref:
            dokument = dokument_index.get(dokument_id)
            if dokument:
                plan_ref = dokument.filename

        return Finding(
            id=finding.id,
            document_id=dokument_id,
            gewerk=gewerk,
            kategorie=finding.kategorie,
            prioritaet=finding.prioritaet,
            titel=finding.titel,
            beschreibung=finding.beschreibung,
            agent_quelle=f"rule_engine.{gewerk.value}",
            konfidenz_score=finding.konfidenz_score,
            norm_referenz=finding.norm_referenz,
            plan_referenz=plan_ref,
            empfehlung=finding.empfehlung,
        )

    def _document_payload(self, dokument: Document) -> Dict[str, Any]:
        return {
            "id": dokument.id,
            "filename": dokument.filename,
            "file_path": dokument.file_path,
            "document_type": dokument.document_type,
            "metadaten": dokument.metadaten or {},
        }

    def _document_header(self, dokument: Document) -> Dict[str, Any]:
        return {"id": dokument.id, "filename": dokument.filename}

    def _extract_text(self, file_path: Optional[str]) -> str:
        if not file_path or not self._parser.can_parse(file_path):
            return ""
        try:
            return self._parser.extract_text(file_path) or ""
        except Exception as exc:  # pragma: no cover - defensive
            logger.debug("PDF-Extraktion fehlgeschlagen für %s: %s", file_path, exc)
            return ""

    @staticmethod
    def _find_first_float(text: str, patterns: Iterable[str]) -> Optional[float]:
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if not match:
                continue
            value = match.group(match.lastindex or 1)
            try:
                return float(str(value).replace(",", "."))
            except ValueError:
                continue
        return None

    @staticmethod
    def _find_first_string(text: str, patterns: Iterable[str]) -> Optional[str]:
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(match.lastindex or 1).strip()
        return None

    def _extract_sanitary_fixtures(
        self, text: str, dokument_id: str
    ) -> List[MutableMapping[str, Any]]:
        fixtures: List[MutableMapping[str, Any]] = []
        if not text:
            return fixtures

        for line in text.splitlines():
            if not re.search(r"stagnation|rückfluss|systemtrenner", line, re.IGNORECASE):
                continue
            fixture: MutableMapping[str, Any] = {
                "id": f"{dokument_id}_fixture_{len(fixtures) + 1}",
                "dokument_id": dokument_id,
            }
            bereich = self._find_first_string(
                line,
                [
                    r"(Labor|Krankenhaus|Küche|Gewerbe|Bereich\s+[A-Za-z0-9\-]+)",
                ],
            )
            if bereich:
                fixture["bereich"] = bereich

            stagnation = self._find_first_float(line, [r"Stagnation[^\d]*(\d+[.,]?\d*)"])
            if stagnation is not None:
                fixture["stagnation_hours"] = stagnation

            if re.search(r"rückfluss|systemtrenner|trennstation", line, re.IGNORECASE):
                fixture["backflow_protection"] = True

            if len(fixture) > 2:
                fixtures.append(fixture)

        return fixtures

    def _extract_electrical_circuits(
        self, text: str, dokument: Document
    ) -> List[MutableMapping[str, Any]]:
        if not text:
            return []

        circuits: List[MutableMapping[str, Any]] = []
        seen: set[str] = set()

        for line in text.splitlines():
            if "stromkreis" not in line.lower():
                continue

            name = self._find_first_string(line, [r"Stromkreis\s*([A-Za-z0-9\-_/]+)"])
            if name and name.lower() in seen:
                continue

            entry: MutableMapping[str, Any] = {
                "id": f"{dokument.id}_circuit_{len(circuits) + 1}",
                "name": name or dokument.plan_nummer or dokument.filename,
                "dokument_id": dokument.id,
            }

            drop = self._find_first_float(line, [r"Spannungsfall[^\d]*(\d+[.,]?\d*)"])
            if drop is not None:
                entry["voltage_drop_percent"] = drop

            diversity = self._find_first_float(line, [r"Gleichzeitigkeitsfaktor[^\d]*(\d+[.,]?\d*)"])
            if diversity is not None:
                entry["diversity_factor"] = diversity

            reserve = self._find_first_float(line, [r"Reserve[^\d]*(\d+[.,]?\d*)"])
            if reserve is not None:
                entry["reserve_percent"] = reserve

            circuits.append(entry)
            if name:
                seen.add(name.lower())

        return circuits

    def _extract_lighting_zones(
        self, text: str, dokument: Document
    ) -> List[MutableMapping[str, Any]]:
        if not text:
            return []

        zones: List[MutableMapping[str, Any]] = []
        for line in text.splitlines():
            if "m²" not in line.lower() or ("w" not in line.lower() and "kw" not in line.lower()):
                continue

            area = self._find_first_float(line, [r"(\d+[.,]?\d*)\s*m²"])
            power = self._find_first_float(line, [r"(\d+[.,]?\d*)\s*(?:kW|W)"])
            if area is None or power is None:
                continue

            if re.search(r"kW", line):
                power = power * 1000

            zone_name = self._find_first_string(
                line, [r"(?:Zone|Bereich|Raum)\s*([A-Za-z0-9\- ]+)"]
            ) or dokument.filename

            zones.append(
                {
                    "id": f"{dokument.id}_lighting_{len(zones) + 1}",
                    "name": zone_name.strip(),
                    "flaeche": area,
                    "leistung": power,
                    "nutzung": zone_name.strip().lower(),
                    "dokument_id": dokument.id,
                }
            )

        return zones

    def _extract_electrical_consumers(
        self, text: str, dokument: Document
    ) -> List[MutableMapping[str, Any]]:
        consumers: List[MutableMapping[str, Any]] = []
        if not text:
            return consumers

        if re.search(r"USV", text, re.IGNORECASE):
            consumers.append(
                {
                    "bereich": "usv",
                    "usv_erforderlich": True,
                    "dokument_id": dokument.id,
                }
            )

        for match in re.finditer(r"(Rechenzentrum|Operationssaal|Labor)", text, re.IGNORECASE):
            area = match.group(1).lower()
            consumers.append(
                {
                    "bereich": area,
                    "usv_erforderlich": bool(
                        re.search(r"USV|unterbrechungsfrei", text, re.IGNORECASE)
                    ),
                    "dokument_id": dokument.id,
                }
            )

        return consumers

    def _extract_networks(
        self, text: str, dokument: Document
    ) -> List[MutableMapping[str, Any]]:
        networks: List[MutableMapping[str, Any]] = []
        if not text:
            return networks

        for line in text.splitlines():
            if "rack" not in line.lower() and "switch" not in line.lower():
                continue

            rack_fill = self._find_first_float(line, [r"(\d+[.,]?\d*)\s*%"])
            if rack_fill is not None and rack_fill > 1:
                rack_fill = rack_fill / 100

            zone = self._find_first_string(line, [r"(IT[-\s]*Zone\s*[A-Za-z0-9]+)"])
            networks.append(
                {
                    "id": f"{dokument.id}_net_{len(networks) + 1}",
                    "zone": zone or dokument.filename,
                    "rack_belegung": rack_fill,
                    "kabelschirmung": bool(
                        re.search(r"schirm", line, re.IGNORECASE)
                    ),
                    "dokument_id": dokument.id,
                }
            )

        return networks

    def _extract_fire_alarm(self, text: str) -> Dict[str, Any]:
        if not text or "brandmelde" not in text.lower():
            return {}

        data: Dict[str, Any] = {}
        if re.search(r"DIN\s*14675", text, re.IGNORECASE):
            data["norm"] = "DIN 14675"
        if re.search(r"redundan", text, re.IGNORECASE):
            data["redundante_wege"] = True
        return data

    def _extract_security_areas(
        self, text: str, dokument: Document
    ) -> List[MutableMapping[str, Any]]:
        if not text:
            return []

        areas: List[MutableMapping[str, Any]] = []
        for line in text.splitlines():
            if "sicherheitsbereich" not in line.lower() and "sicherheitszone" not in line.lower():
                continue

            name = self._find_first_string(
                line, [r"Sicherheits(?:bereich|zone)\s*([A-Za-z0-9\- ]+)"]
            )
            entry: MutableMapping[str, Any] = {
                "name": (name or dokument.filename).strip(),
                "dokument_id": dokument.id,
            }

            if re.search(r"redundan", line, re.IGNORECASE):
                entry["redundante_anbindung"] = True
            if re.search(r"video", line, re.IGNORECASE):
                entry["videoueberwachung"] = True
            if re.search(r"zutritt", line, re.IGNORECASE):
                entry["zutrittskontrolle"] = True

            areas.append(entry)

        return areas

    def _extract_sprinkler_zones(
        self, text: str, dokument: Document
    ) -> List[MutableMapping[str, Any]]:
        if not text or "sprinkler" not in text.lower():
            return []

        zones: List[MutableMapping[str, Any]] = []
        for line in text.splitlines():
            if "sprinkler" not in line.lower():
                continue

            hazard = self._find_first_string(
                line,
                [r"(hoch|normal|niedrig)schaden", r"Gefährdungsklasse\s*(hoch|normal|niedrig)"],
            )
            density = self._find_first_float(line, [r"(\d+[.,]?\d*)\s*l/?min\s*·?m²"])
            duration = self._find_first_float(line, [r"(\d+[.,]?\d*)\s*min"])

            entry: MutableMapping[str, Any] = {
                "id": f"{dokument.id}_sprinkler_{len(zones) + 1}",
                "name": dokument.plan_nummer or dokument.filename,
                "gefährdungsklasse": (hazard or "normal").lower(),
                "dokument_id": dokument.id,
            }

            if density is not None:
                entry["berechnete_dichte"] = density
            if duration is not None:
                entry["loescheinwirkzeit"] = duration
            if re.search(r"redundan|reservepumpe", line, re.IGNORECASE):
                entry["pumpenredundanz"] = True

            zones.append(entry)

        return zones

    def _extract_hydrant_data(
        self, text: str, dokument: Document
    ) -> List[MutableMapping[str, Any]]:
        if not text or "hydrant" not in text.lower():
            return []

        hydrants: List[MutableMapping[str, Any]] = []
        for line in text.splitlines():
            if "hydrant" not in line.lower():
                continue

            flow = self._find_first_float(line, [r"(\d+[.,]?\d*)\s*l/min"])
            pressure = self._find_first_float(line, [r"(\d+[.,]?\d*)\s*(?:bar|MPa)"])

            if pressure is not None and re.search(r"bar", line, re.IGNORECASE):
                pressure = pressure / 10  # bar -> MPa

            entry: MutableMapping[str, Any] = {
                "id": f"{dokument.id}_hydrant_{len(hydrants) + 1}",
                "name": dokument.plan_nummer or dokument.filename,
                "dokument_id": dokument.id,
            }

            if flow is not None:
                entry["volumenstrom"] = flow
            if pressure is not None:
                entry["druck"] = pressure

            hydrants.append(entry)

        return hydrants

    def _extract_water_supply(self, text: str) -> Dict[str, Any]:
        if not text:
            return {}

        duration = self._find_first_float(text, [r"Löschwasser[^\d]*(\d+[.,]?\d*)\s*min"])
        if duration is None:
            return {}

        return {"dauer": duration}

    def _extract_automation_systems(
        self, text: str, dokument: Document
    ) -> List[MutableMapping[str, Any]]:
        if not text:
            return []

        systems: List[MutableMapping[str, Any]] = []
        for line in text.splitlines():
            if "klasse" not in line.lower():
                continue

            bacs_class = self._find_first_string(line, [r"Klasse\s*([A-D])"])
            if not bacs_class:
                continue

            gewerk_ref = self._find_first_string(line, [r"KG\s*(\d{3})"])
            entry: MutableMapping[str, Any] = {
                "id": f"{dokument.id}_ga_{len(systems) + 1}",
                "klasse": bacs_class.upper(),
                "gewerk": f"kg{gewerk_ref}" if gewerk_ref else "",
                "dokument_id": dokument.id,
            }

            systems.append(entry)

        return systems

    def _extract_automation_points(
        self, text: str, dokument: Document
    ) -> List[MutableMapping[str, Any]]:
        if not text:
            return []

        points: List[MutableMapping[str, Any]] = []
        for line in text.splitlines():
            if "punkte" not in line.lower():
                continue

            count = self._find_first_float(line, [r"(\d+[.,]?\d*)\s*Punkte"])
            area = self._find_first_float(line, [r"(\d+[.,]?\d*)\s*m²"])
            category = self._find_first_string(
                line, [r"(HVAC|Lighting|Beleuchtung|Metering)"]
            )

            if count is None or area is None:
                continue

            points.append(
                {
                    "id": f"{dokument.id}_points_{len(points) + 1}",
                    "anzahl": count,
                    "flaeche": area,
                    "kategorie": (category or "hvac").lower(),
                    "dokument_id": dokument.id,
                }
            )

        return points
    
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

