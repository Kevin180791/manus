"""
MaterialListService - Automatische Generierung von Materiallisten
Service für ausführende Firmen zur Arbeitsvorbereitung (AVOR)
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
import re

logger = logging.getLogger(__name__)


class MaterialListService:
    """
    Service zur automatischen Generierung von Materiallisten aus Planungsunterlagen
    
    Dieser Service extrahiert Materialien aus Plänen und Berechnungen und erstellt
    strukturierte Materiallisten für die Arbeitsvorbereitung.
    """
    
    def __init__(self):
        self.name = "MaterialListService"
        self.version = "1.0.0"
        
        # Material-Patterns für Extraktion
        self.material_patterns = self._init_material_patterns()
    
    def generiere_materialliste(
        self,
        projekt_id: str,
        gewerk: str,
        dokumente: List[Dict[str, Any]],
        use_llm: bool = False
    ) -> Dict[str, Any]:
        """
        Generiert Materialliste für ein Gewerk
        
        Args:
            projekt_id: Projekt-ID
            gewerk: Gewerk (z.B. "KG420_HEIZUNG")
            dokumente: Liste der Dokumente des Gewerks
            use_llm: Ob LLM für Extraktion verwendet werden soll
            
        Returns:
            Dict mit Materialliste und Metadaten
        """
        logger.info(f"Generiere Materialliste für Projekt {projekt_id}, Gewerk {gewerk}")
        
        # Materialpositionen sammeln
        positionen = []
        
        for dok in dokumente:
            if dok.get("gewerk") == gewerk:
                # Extrahiere Materialien aus Dokument
                dok_positionen = self._extrahiere_materialien_aus_dokument(
                    dok,
                    use_llm=use_llm
                )
                positionen.extend(dok_positionen)
        
        # Duplikate zusammenfassen
        positionen_aggregiert = self._aggregiere_positionen(positionen)
        
        # Sortieren
        positionen_sortiert = sorted(
            positionen_aggregiert,
            key=lambda x: (x["kategorie"], x["bezeichnung"])
        )
        
        # Metadaten
        result = {
            "projekt_id": projekt_id,
            "gewerk": gewerk,
            "anzahl_positionen": len(positionen_sortiert),
            "positionen": positionen_sortiert,
            "erstellt_am": datetime.utcnow().isoformat(),
            "erstellt_von": self.name,
            "extraktionsmethode": "llm" if use_llm else "regelbasiert"
        }
        
        logger.info(f"Materialliste generiert: {len(positionen_sortiert)} Positionen")
        
        return result
    
    def _extrahiere_materialien_aus_dokument(
        self,
        dokument: Dict[str, Any],
        use_llm: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Extrahiert Materialien aus einem einzelnen Dokument
        """
        positionen = []
        
        metadaten = dokument.get("metadaten", {})
        text = metadaten.get("extrahierter_text", "")
        
        if use_llm:
            # LLM-basierte Extraktion (TODO: Implementierung)
            logger.warning("LLM-basierte Extraktion noch nicht implementiert")
            positionen = self._extrahiere_mit_regex(text, dokument)
        else:
            # Regelbasierte Extraktion mit Regex
            positionen = self._extrahiere_mit_regex(text, dokument)
        
        return positionen
    
    def _extrahiere_mit_regex(
        self,
        text: str,
        dokument: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Extrahiert Materialien mit Regex-Patterns
        """
        positionen = []
        gewerk = dokument.get("gewerk", "UNKNOWN")
        
        # Gewerk-spezifische Patterns anwenden
        if gewerk == "KG420_HEIZUNG":
            positionen.extend(self._extrahiere_heizung_materialien(text, dokument))
        elif gewerk == "KG430_LUEFTUNG":
            positionen.extend(self._extrahiere_lueftung_materialien(text, dokument))
        elif gewerk == "KG410_SANITAER":
            positionen.extend(self._extrahiere_sanitaer_materialien(text, dokument))
        
        return positionen
    
    def _extrahiere_heizung_materialien(
        self,
        text: str,
        dokument: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Extrahiert Heizungs-Materialien
        """
        positionen = []
        
        # Heizkörper
        hk_pattern = r"(?:Heizkörper|HK)\s+(?:Typ\s+)?(\d+)\s*(?:x\s*)?(\d+)?\s*(?:mm)?\s*(?:,\s*)?(\d+)?\s*(?:W|Watt)?"
        for match in re.finditer(hk_pattern, text, re.IGNORECASE):
            hoehe = match.group(1)
            breite = match.group(2) if match.group(2) else "600"  # Default
            leistung = match.group(3)
            
            positionen.append({
                "kategorie": "HEIZKOERPER",
                "bezeichnung": f"Heizkörper {hoehe}x{breite}",
                "menge": 1.0,  # TODO: Aus Kontext extrahieren
                "einheit": "Stk",
                "abmessungen": f"{hoehe}x{breite} mm",
                "leistung": f"{leistung} W" if leistung else None,
                "quelle_dokument_id": dokument.get("id"),
                "quelle_plan_referenz": dokument.get("filename"),
                "extraktionsmethode": "regex",
                "konfidenz": 0.7
            })
        
        # Rohrleitungen
        rohr_pattern = r"(?:Rohr|Leitung|RL)\s+DN\s*(\d+)\s*(?:,\s*)?(\d+)?\s*(?:m|Meter)?"
        for match in re.finditer(rohr_pattern, text, re.IGNORECASE):
            dn = match.group(1)
            laenge = match.group(2) if match.group(2) else None
            
            positionen.append({
                "kategorie": "ROHRLEITUNGEN",
                "bezeichnung": f"Rohrleitung DN {dn}",
                "menge": float(laenge) if laenge else 1.0,
                "einheit": "m",
                "abmessungen": f"DN {dn}",
                "material": "Kupfer",  # TODO: Aus Kontext extrahieren
                "quelle_dokument_id": dokument.get("id"),
                "quelle_plan_referenz": dokument.get("filename"),
                "extraktionsmethode": "regex",
                "konfidenz": 0.6
            })
        
        return positionen
    
    def _extrahiere_lueftung_materialien(
        self,
        text: str,
        dokument: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Extrahiert Lüftungs-Materialien
        """
        positionen = []
        
        # Luftauslässe
        auslass_pattern = r"(?:Luftauslass|LA|Auslass)\s+(\d+)\s*x\s*(\d+)\s*(?:mm)?"
        for match in re.finditer(auslass_pattern, text, re.IGNORECASE):
            breite = match.group(1)
            hoehe = match.group(2)
            
            positionen.append({
                "kategorie": "LUEFTUNGSAUSLAESSE",
                "bezeichnung": f"Luftauslass {breite}x{hoehe}",
                "menge": 1.0,
                "einheit": "Stk",
                "abmessungen": f"{breite}x{hoehe} mm",
                "quelle_dokument_id": dokument.get("id"),
                "quelle_plan_referenz": dokument.get("filename"),
                "extraktionsmethode": "regex",
                "konfidenz": 0.7
            })
        
        # Kanäle
        kanal_pattern = r"(?:Kanal|KA)\s+(\d+)\s*x\s*(\d+)\s*(?:mm)?\s*(?:,\s*)?(\d+)?\s*(?:m|Meter)?"
        for match in re.finditer(kanal_pattern, text, re.IGNORECASE):
            breite = match.group(1)
            hoehe = match.group(2)
            laenge = match.group(3) if match.group(3) else None
            
            positionen.append({
                "kategorie": "KANAELE",
                "bezeichnung": f"Kanal {breite}x{hoehe}",
                "menge": float(laenge) if laenge else 1.0,
                "einheit": "m",
                "abmessungen": f"{breite}x{hoehe} mm",
                "material": "Stahlblech",  # TODO: Aus Kontext extrahieren
                "quelle_dokument_id": dokument.get("id"),
                "quelle_plan_referenz": dokument.get("filename"),
                "extraktionsmethode": "regex",
                "konfidenz": 0.6
            })
        
        return positionen
    
    def _extrahiere_sanitaer_materialien(
        self,
        text: str,
        dokument: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Extrahiert Sanitär-Materialien
        """
        positionen = []
        
        # Sanitärarmaturen
        armatur_pattern = r"(?:WC|Waschbecken|Dusche|Badewanne|Urinal)"
        for match in re.finditer(armatur_pattern, text, re.IGNORECASE):
            typ = match.group(0)
            
            positionen.append({
                "kategorie": "SANITAERARMATUREN",
                "bezeichnung": typ,
                "menge": 1.0,
                "einheit": "Stk",
                "quelle_dokument_id": dokument.get("id"),
                "quelle_plan_referenz": dokument.get("filename"),
                "extraktionsmethode": "regex",
                "konfidenz": 0.8
            })
        
        return positionen
    
    def _aggregiere_positionen(
        self,
        positionen: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Aggregiert gleiche Positionen und summiert Mengen
        """
        aggregiert = {}
        
        for pos in positionen:
            # Schlüssel für Gruppierung
            key = (
                pos.get("kategorie"),
                pos.get("bezeichnung"),
                pos.get("abmessungen"),
                pos.get("material")
            )
            
            if key in aggregiert:
                # Menge addieren
                aggregiert[key]["menge"] += pos.get("menge", 0)
                # Konfidenz mitteln
                aggregiert[key]["konfidenz"] = (
                    aggregiert[key]["konfidenz"] + pos.get("konfidenz", 0)
                ) / 2
            else:
                aggregiert[key] = pos.copy()
        
        return list(aggregiert.values())
    
    def _init_material_patterns(self) -> Dict[str, List[str]]:
        """
        Initialisiert Material-Patterns für verschiedene Gewerke
        """
        return {
            "KG420_HEIZUNG": [
                r"Heizkörper",
                r"HK",
                r"Rohr",
                r"DN\s*\d+",
                r"Ventil",
                r"Pumpe"
            ],
            "KG430_LUEFTUNG": [
                r"Luftauslass",
                r"LA",
                r"Kanal",
                r"KA",
                r"Ventilator",
                r"Filter"
            ],
            "KG410_SANITAER": [
                r"WC",
                r"Waschbecken",
                r"Dusche",
                r"Badewanne",
                r"Urinal",
                r"Armatur"
            ]
        }
    
    def exportiere_csv(
        self,
        materialliste: Dict[str, Any],
        output_path: str
    ) -> str:
        """
        Exportiert Materialliste als CSV
        
        Args:
            materialliste: Materialliste-Dict
            output_path: Pfad zur Ausgabedatei
            
        Returns:
            Pfad zur erstellten CSV-Datei
        """
        import csv
        
        logger.info(f"Exportiere Materialliste als CSV: {output_path}")
        
        positionen = materialliste.get("positionen", [])
        
        with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = [
                "Kategorie",
                "Bezeichnung",
                "Menge",
                "Einheit",
                "Abmessungen",
                "Material",
                "Hersteller",
                "Typ",
                "Artikelnummer",
                "Quelle"
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for pos in positionen:
                writer.writerow({
                    "Kategorie": pos.get("kategorie", ""),
                    "Bezeichnung": pos.get("bezeichnung", ""),
                    "Menge": pos.get("menge", ""),
                    "Einheit": pos.get("einheit", ""),
                    "Abmessungen": pos.get("abmessungen", ""),
                    "Material": pos.get("material", ""),
                    "Hersteller": pos.get("hersteller", ""),
                    "Typ": pos.get("typ", ""),
                    "Artikelnummer": pos.get("artikelnummer", ""),
                    "Quelle": pos.get("quelle_plan_referenz", "")
                })
        
        logger.info(f"CSV-Export abgeschlossen: {len(positionen)} Positionen")
        
        return output_path

