"""
Unit-Tests für MaterialListService
"""

import pytest
import tempfile
import os
from services.material_list_service import MaterialListService


class TestMaterialListService:
    """Test-Suite für MaterialListService"""
    
    @pytest.fixture
    def service(self):
        """Service-Instanz für Tests"""
        return MaterialListService()
    
    def test_service_initialisierung(self, service):
        """Test: Service wird korrekt initialisiert"""
        assert service.name == "MaterialListService"
        assert service.version == "1.0.0"
    
    def test_generiere_materialliste_kg420(self, service):
        """Test: Materialliste für KG420 Heizung wird generiert"""
        dokumente = [
            {
                "id": "1",
                "filename": "HZ-01-EG.pdf",
                "gewerk": "KG420_HEIZUNG",
                "metadaten": {
                    "extrahierter_text": """
                    Heizkörper 600x1000 (15 Stk)
                    Heizkörper 600x800 (10 Stk)
                    Rohrleitung DN 20 Kupfer (50 m)
                    Rohrleitung DN 25 Kupfer (30 m)
                    Kugelhahn DN 20 (25 Stk)
                    """
                }
            }
        ]
        
        result = service.generiere_materialliste(
            projekt_id="test-123",
            gewerk="KG420_HEIZUNG",
            dokumente=dokumente,
            use_llm=False
        )
        
        # Assertions
        assert "positionen" in result
        assert len(result["positionen"]) > 0
        
        # Prüfe, ob Heizkörper extrahiert wurden
        heizkoerper = [p for p in result["positionen"] if p["kategorie"] == "HEIZKOERPER"]
        assert len(heizkoerper) > 0
        
        # Prüfe, ob Rohrleitungen extrahiert wurden
        rohre = [p for p in result["positionen"] if p["kategorie"] == "ROHRLEITUNGEN"]
        assert len(rohre) > 0
    
    def test_generiere_materialliste_kg430(self, service):
        """Test: Materialliste für KG430 Lüftung wird generiert"""
        dokumente = [
            {
                "id": "1",
                "filename": "LU-01-EG.pdf",
                "gewerk": "KG430_LUEFTUNG",
                "metadaten": {
                    "extrahierter_text": """
                    Luftauslass 200x200 (20 Stk)
                    Luftauslass 300x300 (15 Stk)
                    Kanal 400x200 (80 m)
                    """
                }
            }
        ]
        
        result = service.generiere_materialliste(
            projekt_id="test-123",
            gewerk="KG430_LUEFTUNG",
            dokumente=dokumente,
            use_llm=False
        )
        
        # Assertions
        assert "positionen" in result
        assert len(result["positionen"]) > 0
        
        # Prüfe, ob Luftauslässe extrahiert wurden
        luftauslaesse = [p for p in result["positionen"] if p["kategorie"] == "LUFTAUSLAESSE"]
        assert len(luftauslaesse) > 0
    
    def test_extrahiere_materialien_regelbasiert(self, service):
        """Test: Regelbasierte Extraktion funktioniert"""
        text = """
        Heizkörper 600x1000 (15 Stk)
        Rohrleitung DN 20 Kupfer (50 m)
        Kugelhahn DN 20 (25 Stk)
        """
        
        positionen = service._extrahiere_materialien_regelbasiert(text, "KG420_HEIZUNG")
        
        # Assertions
        assert len(positionen) > 0
        assert all("kategorie" in p for p in positionen)
        assert all("bezeichnung" in p for p in positionen)
        assert all("menge" in p for p in positionen)
        assert all("einheit" in p for p in positionen)
    
    def test_extrahiere_heizkoerper(self, service):
        """Test: Heizkörper-Extraktion funktioniert"""
        text = "Heizkörper 600x1000 (15 Stk) Heizkörper 600x800 (10 Stk)"
        
        positionen = service._extrahiere_heizkoerper(text)
        
        # Assertions
        assert len(positionen) == 2
        assert positionen[0]["kategorie"] == "HEIZKOERPER"
        assert positionen[0]["menge"] == 15.0
        assert positionen[0]["einheit"] == "Stk"
        assert "600x1000" in positionen[0]["bezeichnung"]
    
    def test_extrahiere_rohrleitungen(self, service):
        """Test: Rohrleitungs-Extraktion funktioniert"""
        text = "Rohrleitung DN 20 Kupfer (50 m) Rohrleitung DN 25 Stahl (30 m)"
        
        positionen = service._extrahiere_rohrleitungen(text)
        
        # Assertions
        assert len(positionen) == 2
        assert positionen[0]["kategorie"] == "ROHRLEITUNGEN"
        assert positionen[0]["menge"] == 50.0
        assert positionen[0]["einheit"] == "m"
        assert "DN 20" in positionen[0]["bezeichnung"]
        assert positionen[0]["material"] == "Kupfer"
    
    def test_extrahiere_armaturen(self, service):
        """Test: Armaturen-Extraktion funktioniert"""
        text = "Kugelhahn DN 20 (25 Stk) Absperrhahn DN 25 (15 Stk)"
        
        positionen = service._extrahiere_armaturen(text)
        
        # Assertions
        assert len(positionen) == 2
        assert positionen[0]["kategorie"] == "ARMATUREN"
        assert positionen[0]["menge"] == 25.0
        assert "Kugelhahn" in positionen[0]["bezeichnung"]
    
    def test_extrahiere_luftauslaesse(self, service):
        """Test: Luftauslass-Extraktion funktioniert"""
        text = "Luftauslass 200x200 (20 Stk) Luftauslass 300x300 (15 Stk)"
        
        positionen = service._extrahiere_luftauslaesse(text)
        
        # Assertions
        assert len(positionen) == 2
        assert positionen[0]["kategorie"] == "LUFTAUSLAESSE"
        assert positionen[0]["menge"] == 20.0
        assert "200x200" in positionen[0]["bezeichnung"]
    
    def test_aggregiere_positionen(self, service):
        """Test: Aggregation funktioniert"""
        positionen = [
            {"kategorie": "HEIZKOERPER", "bezeichnung": "Heizkörper 600x1000", "menge": 10.0, "einheit": "Stk"},
            {"kategorie": "HEIZKOERPER", "bezeichnung": "Heizkörper 600x1000", "menge": 5.0, "einheit": "Stk"},
            {"kategorie": "HEIZKOERPER", "bezeichnung": "Heizkörper 600x800", "menge": 8.0, "einheit": "Stk"},
        ]
        
        aggregiert = service._aggregiere_positionen(positionen)
        
        # Assertions
        assert len(aggregiert) == 2  # 2 verschiedene Heizkörper-Typen
        
        # Prüfe, ob 600x1000 aggregiert wurde
        hk_600x1000 = [p for p in aggregiert if "600x1000" in p["bezeichnung"]][0]
        assert hk_600x1000["menge"] == 15.0  # 10 + 5
    
    def test_exportiere_csv(self, service):
        """Test: CSV-Export funktioniert"""
        materialliste = {
            "projekt_id": "test-123",
            "gewerk": "KG420_HEIZUNG",
            "positionen": [
                {
                    "kategorie": "HEIZKOERPER",
                    "bezeichnung": "Heizkörper 600x1000",
                    "menge": 15.0,
                    "einheit": "Stk",
                    "abmessungen": "600x1000 mm",
                    "material": None,
                    "hersteller": None,
                    "typ": None,
                    "artikelnummer": None,
                    "quelle_plan_referenz": "HZ-01-EG.pdf"
                }
            ]
        }
        
        # Temporäre Datei
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv') as f:
            csv_path = f.name
        
        try:
            result_path = service.exportiere_csv(materialliste, csv_path)
            
            # Assertions
            assert os.path.exists(result_path)
            
            # CSV-Inhalt prüfen
            with open(result_path, 'r', encoding='utf-8') as f:
                content = f.read()
                assert "Kategorie" in content
                assert "Bezeichnung" in content
                assert "Heizkörper 600x1000" in content
        finally:
            # Aufräumen
            if os.path.exists(csv_path):
                os.remove(csv_path)
    
    def test_konfidenz_berechnung(self, service):
        """Test: Konfidenz-Berechnung funktioniert"""
        # Position mit allen Details
        position_hoch = {
            "kategorie": "HEIZKOERPER",
            "bezeichnung": "Heizkörper 600x1000",
            "menge": 15.0,
            "einheit": "Stk",
            "abmessungen": "600x1000 mm",
            "material": "Stahl",
            "hersteller": "Kermi",
            "typ": "Typ 22"
        }
        
        konfidenz_hoch = service._berechne_konfidenz(position_hoch)
        assert konfidenz_hoch >= 0.8
        
        # Position mit wenigen Details
        position_niedrig = {
            "kategorie": "HEIZKOERPER",
            "bezeichnung": "Heizkörper",
            "menge": 15.0,
            "einheit": "Stk"
        }
        
        konfidenz_niedrig = service._berechne_konfidenz(position_niedrig)
        assert konfidenz_niedrig < 0.6


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

