"""
ExecutionReadinessAgent - Prüfung der Ausführungsreife
Spezialisierter Agent für ausführende Firmen
"""

from typing import List, Dict, Any, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ExecutionReadinessAgent:
    """
    Agent zur Prüfung der Ausführungsreife von TGA-Planungsunterlagen
    
    Dieser Agent prüft, ob die Planungsunterlagen ausreichend detailliert und vollständig sind,
    um mit der Ausführung zu beginnen.
    """
    
    def __init__(self):
        self.name = "ExecutionReadinessAgent"
        self.version = "1.0.0"
        
        # Gewichtungen für Gesamtscore
        self.weights = {
            "vollstaendigkeit": 0.35,
            "detailgrad": 0.30,
            "materialspezifikation": 0.20,
            "schnittstellen": 0.15
        }
        
        # Schwellwerte für Status
        self.thresholds = {
            "ausfuehrungsreif": 0.85,      # >= 85% → Grün
            "klaerungsbedarf": 0.60        # >= 60% → Gelb, < 60% → Rot
        }
    
    def pruefe_ausfuehrungsreife(
        self,
        projekt_data: Dict[str, Any],
        dokumente: List[Dict[str, Any]],
        befunde: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Hauptmethode: Prüft die Ausführungsreife eines Projekts
        
        Args:
            projekt_data: Projektinformationen (Typ, Leistungsphase, etc.)
            dokumente: Liste aller Dokumente des Projekts
            befunde: Liste aller Befunde aus der Planprüfung
            
        Returns:
            Dict mit Prüfergebnis und Empfehlungen
        """
        logger.info(f"Starte Ausführungsreife-Prüfung für Projekt {projekt_data.get('name')}")
        
        # 1. Vollständigkeitsprüfung
        vollstaendigkeit_result = self._pruefe_vollstaendigkeit(projekt_data, dokumente)
        
        # 2. Detailgrad-Prüfung
        detailgrad_result = self._pruefe_detailgrad(projekt_data, dokumente)
        
        # 3. Materialspezifikations-Prüfung
        materialspez_result = self._pruefe_materialspezifikationen(dokumente, befunde)
        
        # 4. Schnittstellen-Prüfung
        schnittstellen_result = self._pruefe_schnittstellen(dokumente, befunde)
        
        # 5. Gesamtbewertung berechnen
        gesamt_score = self._berechne_gesamtscore({
            "vollstaendigkeit": vollstaendigkeit_result["score"],
            "detailgrad": detailgrad_result["score"],
            "materialspezifikation": materialspez_result["score"],
            "schnittstellen": schnittstellen_result["score"]
        })
        
        # 6. Status bestimmen
        status = self._bestimme_status(gesamt_score)
        
        # 7. Empfehlungen generieren
        empfehlung, naechste_schritte = self._generiere_empfehlungen(
            status,
            vollstaendigkeit_result,
            detailgrad_result,
            materialspez_result,
            schnittstellen_result
        )
        
        # 8. Ergebnis zusammenstellen
        result = {
            "status": status,
            "gesamt_score": gesamt_score,
            "scores": {
                "vollstaendigkeit": vollstaendigkeit_result["score"],
                "detailgrad": detailgrad_result["score"],
                "materialspezifikation": materialspez_result["score"],
                "schnittstellen": schnittstellen_result["score"]
            },
            "details": {
                "vollstaendigkeit": vollstaendigkeit_result,
                "detailgrad": detailgrad_result,
                "materialspezifikation": materialspez_result,
                "schnittstellen": schnittstellen_result
            },
            "empfehlung": empfehlung,
            "naechste_schritte": naechste_schritte,
            "geprueft_am": datetime.utcnow().isoformat(),
            "geprueft_von": self.name
        }
        
        logger.info(f"Ausführungsreife-Prüfung abgeschlossen: Status={status}, Score={gesamt_score:.2f}")
        
        return result
    
    def _pruefe_vollstaendigkeit(
        self,
        projekt_data: Dict[str, Any],
        dokumente: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Prüft, ob alle erforderlichen Dokumente für LP5 vorhanden sind
        """
        logger.debug("Prüfe Vollständigkeit der Dokumente")
        
        leistungsphase = projekt_data.get("leistungsphase", "LP5")
        projekt_typ = projekt_data.get("typ", "OFFICE")
        
        # Erforderliche Dokumente je Gewerk für LP5
        erforderliche_dokumente = self._get_erforderliche_dokumente_lp5(projekt_typ)
        
        # Vorhandene Dokumente gruppieren
        vorhandene_dokumente = {}
        for dok in dokumente:
            gewerk = dok.get("gewerk", "UNKNOWN")
            dok_typ = dok.get("document_type", "UNKNOWN")
            
            if gewerk not in vorhandene_dokumente:
                vorhandene_dokumente[gewerk] = set()
            vorhandene_dokumente[gewerk].add(dok_typ)
        
        # Fehlende Dokumente identifizieren
        fehlende_dokumente = []
        for gewerk, erforderlich in erforderliche_dokumente.items():
            vorhanden = vorhandene_dokumente.get(gewerk, set())
            fehlend = erforderlich - vorhanden
            
            for dok_typ in fehlend:
                fehlende_dokumente.append({
                    "gewerk": gewerk,
                    "dokument_typ": dok_typ,
                    "prioritaet": self._get_dokument_prioritaet(dok_typ),
                    "grund": "Nicht in Dokumentenliste gefunden"
                })
        
        # Score berechnen
        total_erforderlich = sum(len(docs) for docs in erforderliche_dokumente.values())
        total_vorhanden = sum(len(docs) for docs in vorhandene_dokumente.values())
        score = min(1.0, total_vorhanden / total_erforderlich) if total_erforderlich > 0 else 0.0
        
        return {
            "score": score,
            "fehlende_dokumente": fehlende_dokumente,
            "anzahl_fehlend": len(fehlende_dokumente),
            "anzahl_vorhanden": total_vorhanden,
            "anzahl_erforderlich": total_erforderlich
        }
    
    def _pruefe_detailgrad(
        self,
        projekt_data: Dict[str, Any],
        dokumente: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Prüft, ob der Detailgrad der Pläne für die Ausführung ausreichend ist
        """
        logger.debug("Prüfe Detailgrad der Pläne")
        
        # Kriterien für ausreichenden Detailgrad
        detail_checks = []
        
        for dok in dokumente:
            if dok.get("document_type") == "plan":
                gewerk = dok.get("gewerk")
                metadaten = dok.get("metadaten", {})
                
                # Check 1: Sind Detailzeichnungen vorhanden?
                has_details = self._check_has_detail_drawings(metadaten)
                
                # Check 2: Ist Bemaßung vorhanden?
                has_dimensions = self._check_has_dimensions(metadaten)
                
                # Check 3: Sind Materialangaben vorhanden?
                has_materials = self._check_has_material_specs(metadaten)
                
                detail_checks.append({
                    "dokument": dok.get("filename"),
                    "gewerk": gewerk,
                    "has_details": has_details,
                    "has_dimensions": has_dimensions,
                    "has_materials": has_materials,
                    "score": (has_details + has_dimensions + has_materials) / 3.0
                })
        
        # Gesamtscore berechnen
        if detail_checks:
            avg_score = sum(c["score"] for c in detail_checks) / len(detail_checks)
        else:
            avg_score = 0.0
        
        # Problematische Pläne identifizieren
        problematische_plaene = [c for c in detail_checks if c["score"] < 0.7]
        
        return {
            "score": avg_score,
            "detail_checks": detail_checks,
            "problematische_plaene": problematische_plaene,
            "anzahl_geprueft": len(detail_checks)
        }
    
    def _pruefe_materialspezifikationen(
        self,
        dokumente: List[Dict[str, Any]],
        befunde: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Prüft, ob Materialien eindeutig spezifiziert sind
        """
        logger.debug("Prüfe Materialspezifikationen")
        
        # Befunde zu unklaren Materialspezifikationen filtern
        material_befunde = [
            b for b in befunde
            if "material" in b.get("beschreibung", "").lower() or
               "spezifikation" in b.get("beschreibung", "").lower()
        ]
        
        # Kritische Material-Befunde (hohe Priorität)
        kritische_material_befunde = [
            b for b in material_befunde
            if b.get("prioritaet") == "HOCH"
        ]
        
        # Score berechnen (weniger Befunde = besser)
        # Annahme: Bei 0 Befunden = 100%, bei 10+ Befunden = 0%
        score = max(0.0, 1.0 - (len(material_befunde) / 10.0))
        
        return {
            "score": score,
            "anzahl_befunde": len(material_befunde),
            "kritische_befunde": kritische_material_befunde,
            "anzahl_kritisch": len(kritische_material_befunde)
        }
    
    def _pruefe_schnittstellen(
        self,
        dokumente: List[Dict[str, Any]],
        befunde: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Prüft, ob Schnittstellen zwischen Gewerken geklärt sind
        """
        logger.debug("Prüfe Schnittstellen zwischen Gewerken")
        
        # SuD-Pläne vorhanden?
        sud_plaene = [d for d in dokumente if "sud" in d.get("filename", "").lower() or
                                               "schlitz" in d.get("filename", "").lower() or
                                               "durchbruch" in d.get("filename", "").lower()]
        
        has_sud_plans = len(sud_plaene) > 0
        
        # Koordinationspläne vorhanden?
        coord_plaene = [d for d in dokumente if "koordination" in d.get("filename", "").lower() or
                                                 "coord" in d.get("filename", "").lower()]
        
        has_coord_plans = len(coord_plaene) > 0
        
        # Befunde zu Schnittstellen filtern
        schnittstellen_befunde = [
            b for b in befunde
            if "schnittstelle" in b.get("beschreibung", "").lower() or
               "koordination" in b.get("beschreibung", "").lower() or
               "kollision" in b.get("beschreibung", "").lower()
        ]
        
        # Score berechnen
        score = 0.0
        if has_sud_plans:
            score += 0.4
        if has_coord_plans:
            score += 0.3
        # Weniger Schnittstellen-Befunde = besser
        score += max(0.0, 0.3 - (len(schnittstellen_befunde) / 10.0) * 0.3)
        
        return {
            "score": score,
            "has_sud_plans": has_sud_plans,
            "has_coord_plans": has_coord_plans,
            "anzahl_befunde": len(schnittstellen_befunde),
            "schnittstellen_befunde": schnittstellen_befunde
        }
    
    def _berechne_gesamtscore(self, scores: Dict[str, float]) -> float:
        """
        Berechnet gewichteten Gesamtscore
        """
        gesamt = sum(scores[key] * self.weights[key] for key in scores)
        return round(gesamt, 3)
    
    def _bestimme_status(self, gesamt_score: float) -> str:
        """
        Bestimmt Status basierend auf Gesamtscore
        """
        if gesamt_score >= self.thresholds["ausfuehrungsreif"]:
            return "ausfuehrungsreif"
        elif gesamt_score >= self.thresholds["klaerungsbedarf"]:
            return "klaerungsbedarf"
        else:
            return "nicht_ausfuehrungsreif"
    
    def _generiere_empfehlungen(
        self,
        status: str,
        vollstaendigkeit: Dict,
        detailgrad: Dict,
        materialspez: Dict,
        schnittstellen: Dict
    ) -> Tuple[str, List[Dict[str, str]]]:
        """
        Generiert Empfehlungen und nächste Schritte
        """
        empfehlung = ""
        naechste_schritte = []
        
        if status == "ausfuehrungsreif":
            empfehlung = "Die Planungsunterlagen sind ausführungsreif. Sie können mit der Arbeitsvorbereitung beginnen."
            naechste_schritte.append({
                "aktion": "Arbeitsvorbereitung starten",
                "beschreibung": "Materiallisten erstellen und Ressourcenplanung durchführen"
            })
        
        elif status == "klaerungsbedarf":
            empfehlung = "Die Planungsunterlagen haben Klärungsbedarf. Bitte klären Sie die identifizierten Punkte vor Baustellenstart."
            
            # Spezifische Empfehlungen basierend auf Scores
            if vollstaendigkeit["score"] < 0.7:
                naechste_schritte.append({
                    "aktion": "Fehlende Dokumente anfordern",
                    "beschreibung": f"{vollstaendigkeit['anzahl_fehlend']} Dokumente fehlen"
                })
            
            if detailgrad["score"] < 0.7:
                naechste_schritte.append({
                    "aktion": "Detailzeichnungen nachfordern",
                    "beschreibung": f"{len(detailgrad['problematische_plaene'])} Pläne haben unzureichenden Detailgrad"
                })
            
            if materialspez["score"] < 0.7:
                naechste_schritte.append({
                    "aktion": "Materialspezifikationen klären",
                    "beschreibung": f"{materialspez['anzahl_kritisch']} kritische Befunde zu Materialien"
                })
            
            if schnittstellen["score"] < 0.7:
                naechste_schritte.append({
                    "aktion": "Schnittstellen koordinieren",
                    "beschreibung": "Koordination mit anderen Gewerken erforderlich"
                })
        
        else:  # nicht_ausfuehrungsreif
            empfehlung = "Die Planungsunterlagen sind NICHT ausführungsreif. Es bestehen erhebliche Mängel, die vor Baustellenstart behoben werden müssen."
            naechste_schritte.append({
                "aktion": "Planungsbüro kontaktieren",
                "beschreibung": "Umfassende Überarbeitung der Planung erforderlich"
            })
            naechste_schritte.append({
                "aktion": "Baustellenstart verschieben",
                "beschreibung": "Baustellenstart erst nach Behebung der Mängel möglich"
            })
        
        return empfehlung, naechste_schritte
    
    # Hilfsmethoden
    
    def _get_erforderliche_dokumente_lp5(self, projekt_typ: str) -> Dict[str, set]:
        """
        Gibt erforderliche Dokumente für LP5 zurück
        """
        # Basis-Dokumente für alle Gewerke
        basis_dokumente = {
            "plan",
            "schema",
            "berechnung"
        }
        
        return {
            "KG410_SANITAER": basis_dokumente | {"detail"},
            "KG420_HEIZUNG": basis_dokumente | {"detail"},
            "KG430_LUEFTUNG": basis_dokumente | {"detail"},
            "KG440_ELEKTRO": basis_dokumente,
            "KG474_FEUERLOESCHUNG": basis_dokumente,
        }
    
    def _get_dokument_prioritaet(self, dok_typ: str) -> str:
        """
        Bestimmt Priorität eines Dokuments
        """
        if dok_typ in ["plan", "detail"]:
            return "hoch"
        elif dok_typ in ["schema", "berechnung"]:
            return "mittel"
        else:
            return "niedrig"
    
    def _check_has_detail_drawings(self, metadaten: Dict) -> bool:
        """
        Prüft, ob Detailzeichnungen vorhanden sind
        """
        # Vereinfachte Logik - in Realität: OCR/CV-basierte Erkennung
        text = metadaten.get("extrahierter_text", "").lower()
        return "detail" in text or "maßstab 1:" in text
    
    def _check_has_dimensions(self, metadaten: Dict) -> bool:
        """
        Prüft, ob Bemaßung vorhanden ist
        """
        # Vereinfachte Logik - in Realität: OCR/CV-basierte Erkennung
        text = metadaten.get("extrahierter_text", "").lower()
        return "mm" in text or "cm" in text or "m" in text
    
    def _check_has_material_specs(self, metadaten: Dict) -> bool:
        """
        Prüft, ob Materialangaben vorhanden sind
        """
        # Vereinfachte Logik - in Realität: LLM-basierte Extraktion
        text = metadaten.get("extrahierter_text", "").lower()
        return any(mat in text for mat in ["kupfer", "stahl", "kunststoff", "dn"])

