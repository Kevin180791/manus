"""
Document Parser - Echte Dokumentenanalyse für TGA-Pläne
Einfache, funktionsfähige Implementierung ohne Overengineering
"""

import logging
import re
from typing import Dict, List, Optional
from pathlib import Path
try:
    import PyPDF2
except ModuleNotFoundError:  # pragma: no cover - optional dependency
    PyPDF2 = None  # type: ignore[assignment]

try:
    import pdfplumber
except ModuleNotFoundError:  # pragma: no cover - optional dependency
    pdfplumber = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)

class DocumentParser:
    """
    Einfacher, funktionsfähiger PDF-Parser für TGA-Dokumente
    Fokus auf Robustheit und echte Funktionalität
    """
    
    def __init__(self):
        self.supported_formats = ['.pdf']
        
    def can_parse(self, file_path: str) -> bool:
        """Prüft ob Datei geparst werden kann"""
        return Path(file_path).suffix.lower() in self.supported_formats
    
    def extract_text(self, file_path: str) -> str:
        """
        Extrahiert Text aus PDF-Datei
        Einfache, robuste Implementierung
        """
        if not self.can_parse(file_path):
            return ""
            
        if pdfplumber is not None:
            try:
                # Versuche zuerst pdfplumber (besser für Tabellen)
                with pdfplumber.open(file_path) as pdf:
                    text = ""
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"

                    if text.strip():
                        return text

            except Exception as e:
                logger.warning(f"pdfplumber failed for {file_path}: {e}")

        if PyPDF2 is not None:
            try:
                # Fallback auf PyPDF2
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    text = ""
                    for page in pdf_reader.pages:
                        page_text = page.extract_text() or ""
                        text += page_text + "\n"
                    return text

            except Exception as e:
                logger.error(f"PDF parsing failed for {file_path}: {e}")

        return ""
    
    def extract_tables(self, file_path: str) -> List[List[str]]:
        """
        Extrahiert Tabellen aus PDF
        Nützlich für Heizlast- und Luftmengenberechnungen
        """
        if not self.can_parse(file_path):
            return []
            
        tables = []
        if pdfplumber is None:
            return tables

        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_tables = page.extract_tables()
                    if page_tables:
                        for table in page_tables:
                            # Filtere leere Zeilen
                            clean_table = []
                            for row in table:
                                if row and any(cell and str(cell).strip() for cell in row):
                                    clean_table.append([str(cell).strip() if cell else "" for cell in row])
                            if clean_table:
                                tables.append(clean_table)

        except Exception as e:
            logger.error(f"Table extraction failed for {file_path}: {e}")
            
        return tables
    
    def find_heizlast_data(self, file_path: str) -> Dict:
        """
        Sucht nach Heizlastdaten in PDF
        Einfache Regex-basierte Erkennung
        """
        text = self.extract_text(file_path)
        if not text:
            return {}
            
        heizlast_data = {
            'raeume': [],
            'gesamt_heizlast': None,
            'gesamt_heizlast_unit': None,
            'auslegungstemperatur': None
        }
        
        # Suche nach Auslegungstemperatur
        temp_pattern = r'Auslegungstemperatur.*?(-?\d+(?:[.,]\d+)?)\s*°?C'
        temp_match = re.search(temp_pattern, text, re.IGNORECASE)
        if temp_match:
            heizlast_data['auslegungstemperatur'] = float(temp_match.group(1).replace(',', '.'))
        
        # Suche nach Gesamtheizlast
        gesamt_pattern = r'Gesamt.*?heizlast.*?(\d+(?:[.,]\d+)?)\s*(kW|W)'
        gesamt_match = re.search(gesamt_pattern, text, re.IGNORECASE)
        if gesamt_match:
            heizlast_data['gesamt_heizlast'] = float(gesamt_match.group(1).replace(',', '.'))
            heizlast_data['gesamt_heizlast_unit'] = gesamt_match.group(2).upper()
        
        # Suche nach Raumdaten in Tabellen
        tables = self.extract_tables(file_path)
        for table in tables:
            if len(table) > 1:  # Header + mindestens eine Datenzeile
                raum_data = self._parse_heizlast_table(table)
                heizlast_data['raeume'].extend(raum_data)
        
        return heizlast_data
    
    def _parse_heizlast_table(self, table: List[List[str]]) -> List[Dict]:
        """
        Parst Heizlast-Tabelle
        Erkennt typische Spalten automatisch
        """
        if not table or len(table) < 2:
            return []
            
        raw_header = [col or "" for col in table[0]]
        header = [col.lower() for col in raw_header]
        raeume = []
        
        # Finde relevante Spalten
        raum_col = self._find_column(header, ['raum', 'bezeichnung', 'name'])
        flaeche_col = self._find_column(header, ['fläche', 'flaeche', 'area', 'm²'])
        heizlast_col = self._find_column(header, ['heizlast', 'wärmebedarf', 'w', 'kw'])
        
        for row in table[1:]:  # Skip header
            if len(row) > max(raum_col or 0, flaeche_col or 0, heizlast_col or 0):
                raum_data = {}
                
                if raum_col is not None and row[raum_col]:
                    raum_data['name'] = row[raum_col]
                
                if flaeche_col is not None and row[flaeche_col]:
                    try:
                        flaeche_str = re.sub(r'[^\d.,]', '', row[flaeche_col])
                        raum_data['flaeche'] = float(flaeche_str.replace(',', '.'))
                    except ValueError:
                        pass
                
                if heizlast_col is not None and row[heizlast_col]:
                    try:
                        heizlast_str = re.sub(r'[^\d.,-]', '', row[heizlast_col])
                        heizlast = float(heizlast_str.replace(',', '.'))
                        unit = self._detect_power_unit(raw_header[heizlast_col], row[heizlast_col])
                        if not unit:
                            unit = 'kW'
                        raum_data['heizlast'] = heizlast
                        raum_data['heizlast_unit'] = unit
                    except ValueError:
                        pass

                if raum_data and 'name' in raum_data:
                    # Berechne spezifische Heizlast
                    if 'flaeche' in raum_data and 'heizlast' in raum_data and raum_data['flaeche'] > 0:
                        heizlast_value = raum_data['heizlast']
                        unit = raum_data.get('heizlast_unit', 'kW')
                        if isinstance(unit, str) and unit.lower().startswith('w'):
                            heizlast_watt = heizlast_value
                        elif isinstance(unit, str) and unit.lower().startswith('mw'):
                            heizlast_watt = heizlast_value * 1_000_000
                        else:  # kW als Standard
                            heizlast_watt = heizlast_value * 1000
                        raum_data['spezifische_heizlast'] = heizlast_watt / raum_data['flaeche']

                    raeume.append(raum_data)

        return raeume

    def _detect_power_unit(self, header_value: str, cell_value: str) -> Optional[str]:
        """Bestimmt die Leistungseinheit aus Header- oder Zelleninhalt."""
        text = f"{header_value or ''} {cell_value or ''}".lower()
        normalized = re.sub(r'[^a-z]', ' ', text)
        tokens = [token for token in normalized.split() if token]

        if any(token == 'mw' or token == 'megawatt' for token in tokens):
            return 'MW'
        if any(token == 'kw' or token == 'kilowatt' for token in tokens):
            return 'kW'
        if any(token == 'w' or token == 'watt' for token in tokens):
            return 'W'
        return None
    
    def _find_column(self, header: List[str], keywords: List[str]) -> Optional[int]:
        """Findet Spalte basierend auf Keywords"""
        for i, col in enumerate(header):
            for keyword in keywords:
                if keyword in col:
                    return i
        return None
    
    def find_luftmengen_data(self, file_path: str) -> Dict:
        """
        Sucht nach Luftmengendaten in PDF
        Ähnlich wie Heizlastdaten, aber für RLT
        """
        text = self.extract_text(file_path)
        if not text:
            return {}
            
        luftmengen_data = {
            'raeume': [],
            'anlagen': []
        }
        
        # Suche nach RLT-Anlagen
        anlagen_pattern = r'RLT[-\s]*(\d+).*?(\d+(?:[.,]\d+)?)\s*m³/h'
        for match in re.finditer(anlagen_pattern, text, re.IGNORECASE):
            anlage = {
                'nummer': match.group(1),
                'volumenstrom': float(match.group(2).replace(',', '.'))
            }
            luftmengen_data['anlagen'].append(anlage)
        
        # Parse Tabellen für Raumlufttechnik
        tables = self.extract_tables(file_path)
        for table in tables:
            if len(table) > 1:
                raum_data = self._parse_luftmengen_table(table)
                luftmengen_data['raeume'].extend(raum_data)
        
        return luftmengen_data
    
    def _parse_luftmengen_table(self, table: List[List[str]]) -> List[Dict]:
        """Parst Luftmengen-Tabelle"""
        if not table or len(table) < 2:
            return []
            
        header = [col.lower() for col in table[0]]
        raeume = []
        
        # Finde relevante Spalten
        raum_col = self._find_column(header, ['raum', 'bezeichnung'])
        zuluft_col = self._find_column(header, ['zuluft', 'zu', 'supply'])
        abluft_col = self._find_column(header, ['abluft', 'ab', 'exhaust'])
        personen_col = self._find_column(header, ['personen', 'pers', 'people'])
        
        for row in table[1:]:
            if len(row) > max(raum_col or 0, zuluft_col or 0, abluft_col or 0):
                raum_data = {}
                
                if raum_col is not None and row[raum_col]:
                    raum_data['name'] = row[raum_col]
                
                if zuluft_col is not None and row[zuluft_col]:
                    try:
                        zuluft_str = re.sub(r'[^\d.,]', '', row[zuluft_col])
                        raum_data['zuluft'] = float(zuluft_str.replace(',', '.'))
                    except ValueError:
                        pass
                
                if abluft_col is not None and row[abluft_col]:
                    try:
                        abluft_str = re.sub(r'[^\d.,]', '', row[abluft_col])
                        raum_data['abluft'] = float(abluft_str.replace(',', '.'))
                    except ValueError:
                        pass
                
                if personen_col is not None and row[personen_col]:
                    try:
                        personen_str = re.sub(r'[^\d]', '', row[personen_col])
                        raum_data['personen'] = int(personen_str)
                    except ValueError:
                        pass
                
                if raum_data and 'name' in raum_data:
                    raeume.append(raum_data)
        
        return raeume
    
    def extract_metadata(self, file_path: str) -> Dict:
        """
        Extrahiert Metadaten aus Planköpfen
        Sucht nach typischen Plan-Informationen
        """
        text = self.extract_text(file_path)
        if not text:
            return {}
            
        metadata = {}
        
        # Plan-Nummer
        plan_nr_patterns = [
            r'Plan[-\s]*Nr\.?\s*:?\s*([A-Z0-9\-\.]+)',
            r'Zeichnung[-\s]*Nr\.?\s*:?\s*([A-Z0-9\-\.]+)',
            r'TGA[-\s]*(\d+)'
        ]
        
        for pattern in plan_nr_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                metadata['plan_nummer'] = match.group(1)
                break
        
        # Revision
        rev_patterns = [
            r'Rev\.?\s*:?\s*([A-Z0-9]+)',
            r'Revision\s*:?\s*([A-Z0-9]+)',
            r'Index\s*:?\s*([A-Z0-9]+)'
        ]
        
        for pattern in rev_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                metadata['revision'] = match.group(1)
                break
        
        # Datum
        datum_pattern = r'(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})'
        datum_match = re.search(datum_pattern, text)
        if datum_match:
            metadata['datum'] = f"{datum_match.group(1)}.{datum_match.group(2)}.{datum_match.group(3)}"
        
        # Maßstab
        massstab_pattern = r'M\s*:?\s*1\s*:\s*(\d+)'
        massstab_match = re.search(massstab_pattern, text, re.IGNORECASE)
        if massstab_match:
            metadata['massstab'] = f"1:{massstab_match.group(1)}"
        
        return metadata

    def extract_legend(self, file_path: str) -> Dict:
        """Extrahiert Legenden-Einträge aus einem Plan"""
        text = self.extract_text(file_path)
        if not text:
            return {}

        legend_entries: List[Dict[str, str]] = []
        lines = text.splitlines()
        in_legend_section = False
        legend_markers = {"legende", "symbolverzeichnis", "zeichen"}

        for raw_line in lines:
            line = raw_line.strip()
            if not line:
                if in_legend_section and legend_entries:
                    break
                continue

            normalized = line.lower()
            if any(marker in normalized for marker in legend_markers):
                in_legend_section = True
                continue

            if not in_legend_section:
                continue

            match = re.match(r"([A-Za-z0-9/\\+\-]+)\s*[-–:]+\s*(.+)", line)
            if match:
                legend_entries.append(
                    {
                        "symbol": match.group(1).strip(),
                        "beschreibung": match.group(2).strip(),
                    }
                )
                continue

            parts = re.split(r"\s{2,}", line)
            if len(parts) >= 2:
                legend_entries.append(
                    {
                        "symbol": parts[0].strip(),
                        "beschreibung": parts[1].strip(),
                    }
                )
                continue

            if legend_entries:
                break

        if legend_entries:
            return {"symbole": legend_entries}

        return {}

# Einfache Testfunktion
def test_parser():
    """Einfacher Test für den Parser"""
    parser = DocumentParser()
    
    # Test mit einer Beispiel-PDF (falls vorhanden)
    test_file = "test_heizlast.pdf"
    if Path(test_file).exists():
        print("Testing PDF parsing...")
        
        text = parser.extract_text(test_file)
        print(f"Extracted text length: {len(text)}")
        
        heizlast_data = parser.find_heizlast_data(test_file)
        print(f"Found {len(heizlast_data['raeume'])} rooms")
        
        metadata = parser.extract_metadata(test_file)
        print(f"Metadata: {metadata}")
    else:
        print("No test PDF found - parser ready for use")

if __name__ == "__main__":
    test_parser()

