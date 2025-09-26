"""
Enhanced PDF Parser - Verbesserte Tabellenerkennung und Datenextraktion
"""

import logging
import re
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path
import pandas as pd
import pdfplumber
from document_parser import DocumentParser

logger = logging.getLogger(__name__)

class EnhancedPDFParser(DocumentParser):
    """
    Erweiterte PDF-Analyse mit verbesserter Tabellenerkennung
    """
    
    def __init__(self):
        super().__init__()
        self.table_settings = {
            'vertical_strategy': 'lines_strict',
            'horizontal_strategy': 'lines_strict',
            'snap_tolerance': 3,
            'join_tolerance': 3,
            'edge_min_length': 3,
            'min_words_vertical': 3,
            'min_words_horizontal': 1,
            'intersection_tolerance': 3,
            'text_tolerance': 3,
            'text_x_tolerance': 3,
            'text_y_tolerance': 3
        }
    
    def extract_tables_enhanced(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Erweiterte Tabellenerkennung mit verschiedenen Strategien
        """
        if not self.can_parse(file_path):
            return []
        
        tables_data = []
        
        try:
            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    # Strategie 1: Linien-basierte Erkennung
                    line_tables = self._extract_line_based_tables(page, page_num)
                    tables_data.extend(line_tables)
                    
                    # Strategie 2: Text-basierte Erkennung
                    text_tables = self._extract_text_based_tables(page, page_num)
                    tables_data.extend(text_tables)
                    
                    # Strategie 3: Regex-basierte Strukturerkennung
                    regex_tables = self._extract_regex_based_tables(page, page_num)
                    tables_data.extend(regex_tables)
        
        except Exception as e:
            logger.error(f"Enhanced table extraction failed for {file_path}: {e}")
        
        return self._deduplicate_tables(tables_data)
    
    def _extract_line_based_tables(self, page, page_num: int) -> List[Dict[str, Any]]:
        """Linien-basierte Tabellenerkennung"""
        tables = []
        
        try:
            # Verschiedene Einstellungen ausprobieren
            settings_variants = [
                self.table_settings,
                {**self.table_settings, 'vertical_strategy': 'text'},
                {**self.table_settings, 'horizontal_strategy': 'text'},
                {'vertical_strategy': 'text', 'horizontal_strategy': 'text'}
            ]
            
            for i, settings in enumerate(settings_variants):
                page_tables = page.extract_tables(table_settings=settings)
                
                for j, table in enumerate(page_tables or []):
                    if table and len(table) > 1:  # Mindestens Header + 1 Zeile
                        processed_table = self._process_raw_table(table)
                        if processed_table:
                            tables.append({
                                'type': 'line_based',
                                'page': page_num + 1,
                                'table_id': f"line_{page_num}_{i}_{j}",
                                'data': processed_table,
                                'confidence': 0.8
                            })
        
        except Exception as e:
            logger.warning(f"Line-based table extraction failed on page {page_num}: {e}")
        
        return tables
    
    def _extract_text_based_tables(self, page, page_num: int) -> List[Dict[str, Any]]:
        """Text-basierte Tabellenerkennung für Tabellen ohne Linien"""
        tables = []
        
        try:
            text = page.extract_text()
            if not text:
                return tables
            
            # Suche nach tabellenartigen Strukturen
            lines = text.split('\n')
            potential_tables = self._find_table_patterns(lines)
            
            for i, table_lines in enumerate(potential_tables):
                processed_table = self._parse_text_table(table_lines)
                if processed_table:
                    tables.append({
                        'type': 'text_based',
                        'page': page_num + 1,
                        'table_id': f"text_{page_num}_{i}",
                        'data': processed_table,
                        'confidence': 0.6
                    })
        
        except Exception as e:
            logger.warning(f"Text-based table extraction failed on page {page_num}: {e}")
        
        return tables
    
    def _extract_regex_based_tables(self, page, page_num: int) -> List[Dict[str, Any]]:
        """Regex-basierte Erkennung für spezifische TGA-Tabellen"""
        tables = []
        
        try:
            text = page.extract_text()
            if not text:
                return tables
            
            # Heizlast-Tabellen
            heizlast_table = self._extract_heizlast_table_regex(text)
            if heizlast_table:
                tables.append({
                    'type': 'heizlast_regex',
                    'page': page_num + 1,
                    'table_id': f"heizlast_{page_num}",
                    'data': heizlast_table,
                    'confidence': 0.9
                })
            
            # Luftmengen-Tabellen
            luftmengen_table = self._extract_luftmengen_table_regex(text)
            if luftmengen_table:
                tables.append({
                    'type': 'luftmengen_regex',
                    'page': page_num + 1,
                    'table_id': f"luftmengen_{page_num}",
                    'data': luftmengen_table,
                    'confidence': 0.9
                })
        
        except Exception as e:
            logger.warning(f"Regex-based table extraction failed on page {page_num}: {e}")
        
        return tables
    
    def _process_raw_table(self, raw_table: List[List[str]]) -> Optional[Dict[str, Any]]:
        """Verarbeitet rohe Tabellendaten"""
        if not raw_table or len(raw_table) < 2:
            return None
        
        # Bereinige Zellen
        cleaned_table = []
        for row in raw_table:
            cleaned_row = []
            for cell in row:
                if cell is None:
                    cleaned_row.append("")
                else:
                    cleaned_row.append(str(cell).strip())
            cleaned_table.append(cleaned_row)
        
        # Entferne komplett leere Zeilen
        cleaned_table = [row for row in cleaned_table if any(cell for cell in row)]
        
        if len(cleaned_table) < 2:
            return None
        
        # Identifiziere Header
        header = cleaned_table[0]
        data_rows = cleaned_table[1:]
        
        # Konvertiere zu strukturiertem Format
        structured_data = []
        for row in data_rows:
            if len(row) >= len(header) and any(cell for cell in row):
                row_dict = {}
                for i, cell in enumerate(row[:len(header)]):
                    column_name = header[i] if i < len(header) else f"column_{i}"
                    row_dict[column_name] = cell
                structured_data.append(row_dict)
        
        return {
            'header': header,
            'rows': structured_data,
            'raw_data': cleaned_table
        }
    
    def _find_table_patterns(self, lines: List[str]) -> List[List[str]]:
        """Findet tabellenartige Muster in Textzeilen"""
        tables = []
        current_table = []
        
        for line in lines:
            # Erkenne Tabellenzeilen (mehrere Werte getrennt durch Whitespace/Tabs)
            if self._is_table_line(line):
                current_table.append(line)
            else:
                if len(current_table) >= 3:  # Mindestens Header + 2 Datenzeilen
                    tables.append(current_table)
                current_table = []
        
        # Letzte Tabelle hinzufügen
        if len(current_table) >= 3:
            tables.append(current_table)
        
        return tables
    
    def _is_table_line(self, line: str) -> bool:
        """Prüft ob eine Zeile Teil einer Tabelle sein könnte"""
        if not line.strip():
            return False
        
        # Suche nach mehreren durch Whitespace getrennten Werten
        parts = line.split()
        if len(parts) < 2:
            return False
        
        # Prüfe auf numerische Werte (typisch für TGA-Tabellen)
        numeric_count = sum(1 for part in parts if self._contains_number(part))
        
        return numeric_count >= 1 and len(parts) >= 3
    
    def _contains_number(self, text: str) -> bool:
        """Prüft ob Text numerische Werte enthält"""
        return bool(re.search(r'\d+([.,]\d+)?', text))
    
    def _parse_text_table(self, table_lines: List[str]) -> Optional[Dict[str, Any]]:
        """Parst eine textbasierte Tabelle"""
        if len(table_lines) < 2:
            return None
        
        try:
            # Verwende Pandas für intelligente Parsing
            from io import StringIO
            table_text = '\n'.join(table_lines)
            
            # Versuche verschiedene Trennzeichen
            separators = ['\t', '  ', ' ', ';', '|']
            
            for sep in separators:
                try:
                    df = pd.read_csv(StringIO(table_text), sep=sep, engine='python')
                    if len(df.columns) > 1 and len(df) > 0:
                        return {
                            'header': df.columns.tolist(),
                            'rows': df.to_dict('records'),
                            'raw_data': [line.split(sep) for line in table_lines]
                        }
                except:
                    continue
            
            # Fallback: Manuelles Parsing
            return self._manual_text_table_parse(table_lines)
        
        except Exception as e:
            logger.warning(f"Text table parsing failed: {e}")
            return None
    
    def _manual_text_table_parse(self, table_lines: List[str]) -> Dict[str, Any]:
        """Manuelles Parsing wenn automatische Methoden fehlschlagen"""
        # Einfache Whitespace-basierte Trennung
        rows = []
        for line in table_lines:
            # Teile bei mehreren Leerzeichen
            parts = re.split(r'\s{2,}', line.strip())
            if len(parts) > 1:
                rows.append(parts)
        
        if len(rows) < 2:
            return None
        
        header = rows[0]
        data_rows = []
        
        for row in rows[1:]:
            if len(row) >= len(header):
                row_dict = {}
                for i, cell in enumerate(row[:len(header)]):
                    column_name = header[i] if i < len(header) else f"column_{i}"
                    row_dict[column_name] = cell
                data_rows.append(row_dict)
        
        return {
            'header': header,
            'rows': data_rows,
            'raw_data': rows
        }
    
    def _extract_heizlast_table_regex(self, text: str) -> Optional[Dict[str, Any]]:
        """Spezielle Regex-Extraktion für Heizlast-Tabellen"""
        # Pattern für typische Heizlast-Tabellenzeilen
        heizlast_pattern = r'(\w+(?:\s+\w+)*)\s+(\d+[.,]?\d*)\s*m²?\s+(\d+[.,]?\d*)\s*[kW]?\s+(\d+[.,]?\d*)\s*W/m²?'
        
        matches = re.findall(heizlast_pattern, text, re.IGNORECASE | re.MULTILINE)
        
        if not matches:
            return None
        
        rows = []
        for match in matches:
            raum, flaeche, heizlast, spez_heizlast = match
            rows.append({
                'Raum': raum.strip(),
                'Fläche [m²]': flaeche.replace(',', '.'),
                'Heizlast [W]': heizlast.replace(',', '.'),
                'Spez. Heizlast [W/m²]': spez_heizlast.replace(',', '.')
            })
        
        return {
            'header': ['Raum', 'Fläche [m²]', 'Heizlast [W]', 'Spez. Heizlast [W/m²]'],
            'rows': rows,
            'raw_data': matches
        }
    
    def _extract_luftmengen_table_regex(self, text: str) -> Optional[Dict[str, Any]]:
        """Spezielle Regex-Extraktion für Luftmengen-Tabellen"""
        # Pattern für typische Luftmengen-Tabellenzeilen
        luftmengen_pattern = r'(\w+(?:\s+\w+)*)\s+(\d+[.,]?\d*)\s*m³/h\s+(\d+[.,]?\d*)\s*m³/h'
        
        matches = re.findall(luftmengen_pattern, text, re.IGNORECASE | re.MULTILINE)
        
        if not matches:
            return None
        
        rows = []
        for match in matches:
            raum, zuluft, abluft = match
            rows.append({
                'Raum': raum.strip(),
                'Zuluft [m³/h]': zuluft.replace(',', '.'),
                'Abluft [m³/h]': abluft.replace(',', '.')
            })
        
        return {
            'header': ['Raum', 'Zuluft [m³/h]', 'Abluft [m³/h]'],
            'rows': rows,
            'raw_data': matches
        }
    
    def _deduplicate_tables(self, tables: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Entfernt doppelte Tabellen basierend auf Ähnlichkeit"""
        if len(tables) <= 1:
            return tables
        
        unique_tables = []
        
        for table in tables:
            is_duplicate = False
            
            for existing in unique_tables:
                if self._tables_similar(table, existing):
                    # Behalte die Tabelle mit höherer Konfidenz
                    if table.get('confidence', 0) > existing.get('confidence', 0):
                        unique_tables.remove(existing)
                        unique_tables.append(table)
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_tables.append(table)
        
        return unique_tables
    
    def _tables_similar(self, table1: Dict[str, Any], table2: Dict[str, Any]) -> bool:
        """Prüft ob zwei Tabellen ähnlich sind"""
        data1 = table1.get('data', {})
        data2 = table2.get('data', {})
        
        # Vergleiche Header
        header1 = data1.get('header', [])
        header2 = data2.get('header', [])
        
        if len(header1) != len(header2):
            return False
        
        # Vergleiche Anzahl Zeilen
        rows1 = data1.get('rows', [])
        rows2 = data2.get('rows', [])
        
        if abs(len(rows1) - len(rows2)) > 1:  # Toleranz von 1 Zeile
            return False
        
        # Einfacher Ähnlichkeitscheck
        return len(header1) > 0 and len(rows1) > 0
    
    def find_heizlast_data_enhanced(self, file_path: str) -> Dict:
        """Erweiterte Heizlastdaten-Extraktion"""
        # Basis-Extraktion
        base_data = self.find_heizlast_data(file_path)
        
        # Erweiterte Tabellenerkennung
        enhanced_tables = self.extract_tables_enhanced(file_path)
        
        # Suche nach Heizlast-spezifischen Tabellen
        heizlast_tables = [t for t in enhanced_tables if 'heizlast' in t.get('type', '').lower()]
        
        if heizlast_tables:
            # Verwende die beste Heizlast-Tabelle
            best_table = max(heizlast_tables, key=lambda x: x.get('confidence', 0))
            table_data = best_table.get('data', {})
            
            # Konvertiere Tabellendaten zu Heizlast-Format
            enhanced_rooms = []
            for row in table_data.get('rows', []):
                room_data = self._convert_table_row_to_heizlast(row)
                if room_data:
                    enhanced_rooms.append(room_data)
            
            if enhanced_rooms:
                base_data['raeume'] = enhanced_rooms
                base_data['enhanced_extraction'] = True
        
        return base_data
    
    def _convert_table_row_to_heizlast(self, row: Dict[str, str]) -> Optional[Dict]:
        """Konvertiert Tabellenzeile zu Heizlast-Datenformat"""
        try:
            # Suche nach relevanten Spalten (flexibel)
            raum_name = None
            flaeche = None
            heizlast = None
            spez_heizlast = None
            
            for key, value in row.items():
                key_lower = key.lower()
                
                if 'raum' in key_lower or 'bezeichnung' in key_lower:
                    raum_name = value
                elif 'fläche' in key_lower or 'flaeche' in key_lower or 'm²' in key_lower:
                    flaeche = self._extract_number(value)
                elif 'heizlast' in key_lower and 'spez' not in key_lower:
                    heizlast = self._extract_number(value)
                elif 'spez' in key_lower or 'w/m²' in key_lower:
                    spez_heizlast = self._extract_number(value)
            
            if raum_name and (heizlast or flaeche):
                result = {'name': raum_name}
                
                if flaeche:
                    result['flaeche'] = flaeche
                if heizlast:
                    result['heizlast'] = heizlast
                if spez_heizlast:
                    result['spezifische_heizlast'] = spez_heizlast
                elif flaeche and heizlast:
                    result['spezifische_heizlast'] = heizlast / flaeche
                
                return result
        
        except Exception as e:
            logger.warning(f"Error converting table row: {e}")
        
        return None
    
    def _extract_number(self, text: str) -> Optional[float]:
        """Extrahiert numerischen Wert aus Text"""
        if not text:
            return None
        
        # Entferne Einheiten und andere Zeichen
        cleaned = re.sub(r'[^\d.,]', '', str(text))
        cleaned = cleaned.replace(',', '.')
        
        try:
            return float(cleaned)
        except ValueError:
            return None

# Test-Funktion
def test_enhanced_parser():
    """Test der erweiterten Parser-Funktionen"""
    parser = EnhancedPDFParser()
    
    test_file = "../test_heizlast.pdf"
    if Path(test_file).exists():
        print("Testing enhanced PDF parsing...")
        
        # Test erweiterte Tabellenerkennung
        tables = parser.extract_tables_enhanced(test_file)
        print(f"Found {len(tables)} tables with enhanced extraction")
        
        for i, table in enumerate(tables):
            print(f"Table {i+1}: {table['type']} (confidence: {table['confidence']})")
            print(f"  Rows: {len(table['data'].get('rows', []))}")
        
        # Test erweiterte Heizlastdaten
        heizlast_data = parser.find_heizlast_data_enhanced(test_file)
        print(f"Enhanced heizlast extraction: {len(heizlast_data.get('raeume', []))} rooms")
        
        if heizlast_data.get('enhanced_extraction'):
            print("✓ Enhanced extraction was used")
        else:
            print("○ Fallback to basic extraction")
    
    else:
        print("No test PDF found - enhanced parser ready for use")

if __name__ == "__main__":
    test_enhanced_parser()

