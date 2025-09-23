"""
Lüftungs-Experten-Agent (KG430) - Spezialisierte Fachprüfung für Raumlufttechnische Anlagen
"""

import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import math

logger = logging.getLogger(__name__)

@dataclass
class RaumluftDaten:
    """Datenstruktur für Raumluftdaten"""
    raum_name: str
    flaeche: float  # m²
    volumen: float  # m³
    nutzung: str  # "buero", "klassenraum", "labor", etc.
    personenzahl: int
    aussenluftvolumenstrom: float  # m³/h
    zuluftvolumenstrom: float  # m³/h
    abluftvolumenstrom: float  # m³/h
    luftwechselrate: float  # 1/h

@dataclass
class RLTAnlageDaten:
    """Datenstruktur für RLT-Anlagen"""
    anlagen_id: str
    typ: str  # "nur_lueftung", "klimaanlage", "teilklimaanlage"
    volumenstrom_gesamt: float  # m³/h
    waermerueckgewinnung: bool
    wrg_wirkungsgrad: Optional[float] = None
    filterklassen: List[str] = None
    heizregister: bool = False
    kuehlregister: bool = False

class LueftungExpert:
    """
    Spezialisierter Agent für die Prüfung von Raumlufttechnischen Anlagen (KG430)
    """
    
    def __init__(self):
        self.normen = {
            "DIN_1946_6": "Raumlufttechnik - Lüftung von Wohnungen",
            "DIN_EN_16798_1": "Energetische Bewertung von Gebäuden - Lüftung von Gebäuden",
            "VDI_6022": "Raumlufttechnik, Raumluftqualität - Hygieneanforderungen",
            "ASR_A3_6": "Lüftung (Arbeitsstättenregel)",
            "DIN_1946_4": "Raumlufttechnische Anlagen in Krankenhäusern",
            "VDI_6040": "Raumlufttechnik - Bürogebäude"
        }
        
        # Gebäudetypspezifische Anforderungen
        self.anforderungen = {
            "buerogebaeude": {
                "aussenluft_pro_person": 36,  # m³/(h·Person) nach ASR A3.6
                "luftwechsel_min": 0.5,  # 1/h
                "luftwechsel_max": 6.0,  # 1/h
                "co2_grenzwert": 1000,  # ppm
                "norm_referenz": "ASR A3.6, VDI 6040"
            },
            "schule": {
                "aussenluft_pro_person": 30,  # m³/(h·Person)
                "luftwechsel_min": 3.0,  # 1/h für Klassenräume
                "luftwechsel_max": 6.0,  # 1/h
                "co2_grenzwert": 1000,  # ppm
                "norm_referenz": "DIN EN 16798-1"
            },
            "krankenhaus": {
                "aussenluft_pro_person": 40,  # m³/(h·Person)
                "luftwechsel_min": 6.0,  # 1/h für Patientenzimmer
                "luftwechsel_max": 15.0,  # 1/h für OP-Bereiche
                "filterklasse_min": "F7",
                "norm_referenz": "DIN 1946-4"
            },
            "industriebau": {
                "aussenluft_pro_person": 25,  # m³/(h·Person)
                "luftwechsel_min": 2.0,  # 1/h
                "luftwechsel_max": 20.0,  # 1/h je nach Prozess
                "norm_referenz": "VDI 2262, ASR A3.6"
            },
            "wohngebaeude": {
                "aussenluft_pro_person": 30,  # m³/(h·Person)
                "luftwechsel_min": 0.5,  # 1/h
                "luftwechsel_max": 3.0,  # 1/h
                "norm_referenz": "DIN 1946-6"
            }
        }
        
        self.filterklassen = {
            "G1": "Grobstaub",
            "G2": "Grobstaub", 
            "G3": "Grobstaub",
            "G4": "Grobstaub",
            "M5": "Feinstaub",
            "M6": "Feinstaub",
            "F7": "Feinstaub",
            "F8": "Feinstaub",
            "F9": "Feinstaub",
            "H10": "Schwebstoff",
            "H11": "Schwebstoff",
            "H12": "Schwebstoff",
            "H13": "Schwebstoff",
            "H14": "Schwebstoff"
        }
    
    async def pruefe_lueftungsplanung(self, dokumente: List[Dict], projekt_typ: str) -> List[Dict]:
        """
        Hauptfunktion für die Lüftungsprüfung
        
        Args:
            dokumente: Liste der zu prüfenden Dokumente
            projekt_typ: Typ des Gebäudes
            
        Returns:
            List[Dict]: Liste der gefundenen Befunde
        """
        befunde = []
        
        for dokument in dokumente:
            # Luftmengenberechnung prüfen
            if "luftmenge" in dokument.get("filename", "").lower():
                befunde.extend(await self._pruefe_luftmengenberechnung(dokument, projekt_typ))
            
            # RLT-Schema prüfen
            if "schema" in dokument.get("filename", "").lower() or "rlt" in dokument.get("filename", "").lower():
                befunde.extend(await self._pruefe_rlt_schema(dokument, projekt_typ))
            
            # Kanalnetzplan prüfen
            if "kanal" in dokument.get("filename", "").lower():
                befunde.extend(await self._pruefe_kanalnetz(dokument))
            
            # Hygieneanforderungen prüfen
            befunde.extend(await self._pruefe_hygiene_anforderungen(dokument, projekt_typ))
        
        return befunde
    
    async def _pruefe_luftmengenberechnung(self, dokument: Dict, projekt_typ: str) -> List[Dict]:
        """Prüft die Luftmengenberechnung"""
        befunde = []
        
        # Hole gebäudetypspezifische Anforderungen
        if projekt_typ not in self.anforderungen:
            befunde.append({
                "id": "lueftung_typ_001",
                "kategorie": "technisch",
                "prioritaet": "mittel",
                "titel": f"Unbekannter Gebäudetyp: {projekt_typ}",
                "beschreibung": "Für diesen Gebäudetyp sind keine spezifischen Lüftungsanforderungen hinterlegt",
                "empfehlung": "Gebäudetyp prüfen und entsprechende Normen anwenden",
                "konfidenz_score": 0.90
            })
            return befunde
        
        anforderungen = self.anforderungen[projekt_typ]
        
        # Simuliere Extraktion von Raumluftdaten
        raumluft_daten = await self._extrahiere_raumluftdaten(dokument, projekt_typ)
        
        if not raumluft_daten:
            befunde.append({
                "id": "lueftung_daten_001",
                "kategorie": "technisch",
                "prioritaet": "hoch",
                "titel": "Luftmengenberechnung unvollständig",
                "beschreibung": "Luftmengenberechnung konnte nicht ausgelesen werden",
                "norm_referenz": anforderungen["norm_referenz"],
                "empfehlung": "Vollständige Luftmengenberechnung nach gültiger Norm erstellen",
                "konfidenz_score": 0.95
            })
            return befunde
        
        # Prüfe jeden Raum
        for raum in raumluft_daten:
            # Prüfe Außenluftvolumenstrom pro Person
            if raum.personenzahl > 0:
                aussenluft_pro_person = raum.aussenluftvolumenstrom / raum.personenzahl
                min_aussenluft = anforderungen["aussenluft_pro_person"]
                
                if aussenluft_pro_person < min_aussenluft:
                    befunde.append({
                        "id": f"lueftung_aussenluft_{raum.raum_name}",
                        "kategorie": "technisch",
                        "prioritaet": "hoch",
                        "titel": f"Zu geringe Außenluftmenge in {raum.raum_name}",
                        "beschreibung": f"Außenluftmenge von {aussenluft_pro_person:.1f} m³/(h·Person) unterschreitet Mindestanforderung von {min_aussenluft} m³/(h·Person)",
                        "norm_referenz": anforderungen["norm_referenz"],
                        "empfehlung": "Außenluftvolumenstrom erhöhen",
                        "konfidenz_score": 0.92
                    })
            
            # Prüfe Luftwechselrate
            if raum.luftwechselrate < anforderungen["luftwechsel_min"]:
                befunde.append({
                    "id": f"lueftung_luftwechsel_niedrig_{raum.raum_name}",
                    "kategorie": "technisch",
                    "prioritaet": "hoch",
                    "titel": f"Zu niedrige Luftwechselrate in {raum.raum_name}",
                    "beschreibung": f"Luftwechselrate von {raum.luftwechselrate:.1f} 1/h unterschreitet Mindestanforderung von {anforderungen['luftwechsel_min']} 1/h",
                    "norm_referenz": anforderungen["norm_referenz"],
                    "empfehlung": "Luftwechselrate erhöhen",
                    "konfidenz_score": 0.90
                })
            
            if raum.luftwechselrate > anforderungen["luftwechsel_max"]:
                befunde.append({
                    "id": f"lueftung_luftwechsel_hoch_{raum.raum_name}",
                    "kategorie": "technisch",
                    "prioritaet": "mittel",
                    "titel": f"Sehr hohe Luftwechselrate in {raum.raum_name}",
                    "beschreibung": f"Luftwechselrate von {raum.luftwechselrate:.1f} 1/h ist ungewöhnlich hoch (>{anforderungen['luftwechsel_max']} 1/h)",
                    "norm_referenz": anforderungen["norm_referenz"],
                    "empfehlung": "Luftwechselrate auf Notwendigkeit prüfen (Energieeffizienz)",
                    "konfidenz_score": 0.75
                })
        
        return befunde
    
    async def _extrahiere_raumluftdaten(self, dokument: Dict, projekt_typ: str) -> List[RaumluftDaten]:
        """Extrahiert Raumluftdaten aus dem Dokument (Simulation)"""
        # Simulierte Daten basierend auf Gebäudetyp
        if projekt_typ == "buerogebaeude":
            return [
                RaumluftDaten(
                    raum_name="Büro 1.01",
                    flaeche=15.0,
                    volumen=37.5,
                    nutzung="buero",
                    personenzahl=2,
                    aussenluftvolumenstrom=60.0,  # 30 m³/(h·Person) - zu niedrig
                    zuluftvolumenstrom=120.0,
                    abluftvolumenstrom=120.0,
                    luftwechselrate=3.2
                ),
                RaumluftDaten(
                    raum_name="Konferenzraum",
                    flaeche=25.0,
                    volumen=75.0,
                    nutzung="besprechung",
                    personenzahl=8,
                    aussenluftvolumenstrom=320.0,  # 40 m³/(h·Person) - OK
                    zuluftvolumenstrom=400.0,
                    abluftvolumenstrom=400.0,
                    luftwechselrate=5.3
                )
            ]
        elif projekt_typ == "schule":
            return [
                RaumluftDaten(
                    raum_name="Klassenraum 1.01",
                    flaeche=60.0,
                    volumen=180.0,
                    nutzung="klassenraum",
                    personenzahl=25,
                    aussenluftvolumenstrom=600.0,  # 24 m³/(h·Person) - zu niedrig
                    zuluftvolumenstrom=720.0,
                    abluftvolumenstrom=720.0,
                    luftwechselrate=4.0
                )
            ]
        else:
            return []
    
    async def _pruefe_rlt_schema(self, dokument: Dict, projekt_typ: str) -> List[Dict]:
        """Prüft das RLT-Anlagenschema"""
        befunde = []
        
        # Simuliere RLT-Anlagen-Daten
        rlt_anlagen = await self._extrahiere_rlt_anlagen_daten(dokument)
        
        for anlage in rlt_anlagen:
            # Prüfe Wärmerückgewinnung
            if not anlage.waermerueckgewinnung:
                befunde.append({
                    "id": f"lueftung_wrg_{anlage.anlagen_id}",
                    "kategorie": "technisch",
                    "prioritaet": "mittel",
                    "titel": f"Keine Wärmerückgewinnung in Anlage {anlage.anlagen_id}",
                    "beschreibung": "Wärmerückgewinnung fehlt - Energieeffizienz kann verbessert werden",
                    "norm_referenz": "GEG, DIN EN 16798-1",
                    "empfehlung": "Wärmerückgewinnung mit Wirkungsgrad >75% vorsehen",
                    "konfidenz_score": 0.85
                })
            elif anlage.wrg_wirkungsgrad and anlage.wrg_wirkungsgrad < 0.75:
                befunde.append({
                    "id": f"lueftung_wrg_eta_{anlage.anlagen_id}",
                    "kategorie": "technisch",
                    "prioritaet": "mittel",
                    "titel": f"Niedriger WRG-Wirkungsgrad in Anlage {anlage.anlagen_id}",
                    "beschreibung": f"WRG-Wirkungsgrad von {anlage.wrg_wirkungsgrad*100:.1f}% ist niedrig",
                    "norm_referenz": "GEG",
                    "empfehlung": "WRG-Wirkungsgrad auf >75% erhöhen",
                    "konfidenz_score": 0.88
                })
            
            # Prüfe Filterklassen
            if anlage.filterklassen:
                await self._pruefe_filterklassen(anlage, projekt_typ, befunde)
        
        return befunde
    
    async def _pruefe_filterklassen(self, anlage: RLTAnlageDaten, projekt_typ: str, befunde: List[Dict]):
        """Prüft die Filterklassen"""
        if projekt_typ == "krankenhaus":
            # Krankenhäuser benötigen mindestens F7-Filter
            min_filter = "F7"
            if not any(f >= min_filter for f in anlage.filterklassen):
                befunde.append({
                    "id": f"lueftung_filter_{anlage.anlagen_id}",
                    "kategorie": "technisch",
                    "prioritaet": "hoch",
                    "titel": f"Unzureichende Filterklasse in Anlage {anlage.anlagen_id}",
                    "beschreibung": f"Krankenhäuser benötigen mindestens {min_filter}-Filter",
                    "norm_referenz": "DIN 1946-4",
                    "empfehlung": f"Mindestens {min_filter}-Filter einsetzen",
                    "konfidenz_score": 0.95
                })
    
    async def _extrahiere_rlt_anlagen_daten(self, dokument: Dict) -> List[RLTAnlageDaten]:
        """Extrahiert RLT-Anlagen-Daten (Simulation)"""
        return [
            RLTAnlageDaten(
                anlagen_id="RLT-01",
                typ="klimaanlage",
                volumenstrom_gesamt=2000.0,
                waermerueckgewinnung=True,
                wrg_wirkungsgrad=0.72,  # Etwas niedrig
                filterklassen=["G4", "F7"],
                heizregister=True,
                kuehlregister=True
            )
        ]
    
    async def _pruefe_kanalnetz(self, dokument: Dict) -> List[Dict]:
        """Prüft das Kanalnetz"""
        befunde = []
        
        # Prüfe Kanalführung und Zugänglichkeit
        befunde.append({
            "id": "lueftung_kanal_001",
            "kategorie": "technisch",
            "prioritaet": "mittel",
            "titel": "Zugänglichkeit der Kanäle prüfen",
            "beschreibung": "Kanäle müssen für Wartung und Reinigung zugänglich sein",
            "norm_referenz": "VDI 6022",
            "empfehlung": "Revisionsöffnungen alle 15m und an Richtungsänderungen vorsehen",
            "konfidenz_score": 0.80
        })
        
        return befunde
    
    async def _pruefe_hygiene_anforderungen(self, dokument: Dict, projekt_typ: str) -> List[Dict]:
        """Prüft Hygieneanforderungen nach VDI 6022"""
        befunde = []
        
        if projekt_typ in ["krankenhaus", "schule", "buerogebaeude"]:
            befunde.append({
                "id": "lueftung_hygiene_001",
                "kategorie": "technisch",
                "prioritaet": "hoch",
                "titel": "Hygieneanforderungen nach VDI 6022",
                "beschreibung": "Nachweis der Hygieneanforderungen nach VDI 6022 erforderlich",
                "norm_referenz": "VDI 6022",
                "empfehlung": "Hygienekonzept nach VDI 6022 erstellen",
                "konfidenz_score": 0.90
            })
        
        return befunde
    
    def get_pruefkriterien(self, projekt_typ: str) -> Dict[str, Any]:
        """
        Gibt die Prüfkriterien für einen bestimmten Projekttyp zurück
        """
        if projekt_typ not in self.anforderungen:
            return {}
        
        anforderungen = self.anforderungen[projekt_typ]
        
        kriterien = {
            "luftmengenberechnung": {
                "norm": anforderungen["norm_referenz"],
                "erforderlich": True,
                "pruefpunkte": [
                    f"Außenluft ≥{anforderungen['aussenluft_pro_person']} m³/(h·Person)",
                    f"Luftwechsel {anforderungen['luftwechsel_min']}-{anforderungen['luftwechsel_max']} 1/h",
                    "Vollständige Raumliste",
                    "Personenbelegung berücksichtigt"
                ]
            },
            "rlt_schema": {
                "norm": "DIN EN 16798-1",
                "erforderlich": True,
                "komponenten": [
                    "Außenluftansaugung",
                    "Filter",
                    "Wärmerückgewinnung",
                    "Heiz-/Kühlregister",
                    "Ventilator",
                    "Schalldämpfer"
                ]
            },
            "hygiene": {
                "norm": "VDI 6022",
                "erforderlich": True,
                "nachweis": "Hygienekonzept"
            }
        }
        
        # Projektspezifische Ergänzungen
        if projekt_typ == "krankenhaus":
            kriterien["filterklassen"] = {
                "mindestens": "F7",
                "op_bereiche": "H13/H14"
            }
            kriterien["druckverhaeltnisse"] = {
                "erforderlich": True,
                "beschreibung": "Über-/Unterdruck-Konzept"
            }
        
        return kriterien

