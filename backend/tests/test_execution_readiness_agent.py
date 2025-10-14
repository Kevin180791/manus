"""
Unit-Tests für ExecutionReadinessAgent
"""

import pytest
from agent_core.execution_readiness_agent import ExecutionReadinessAgent


class TestExecutionReadinessAgent:
    """Test-Suite für ExecutionReadinessAgent"""
    
    @pytest.fixture
    def agent(self):
        """Agent-Instanz für Tests"""
        return ExecutionReadinessAgent()
    
    @pytest.fixture
    def projekt_data(self):
        """Beispiel-Projektdaten"""
        return {
            "id": "test-projekt-123",
            "name": "Testprojekt Bürogebäude",
            "typ": "OFFICE",
            "leistungsphase": "LP5"
        }
    
    def test_agent_initialisierung(self, agent):
        """Test: Agent wird korrekt initialisiert"""
        assert agent.name == "ExecutionReadinessAgent"
        assert agent.version == "1.0.0"
    
    def test_pruefe_ausfuehrungsreife_vollstaendig(self, agent, projekt_data):
        """Test: Vollständige Dokumente führen zu grünem Status"""
        # Vollständige Dokumente für KG420 Heizung
        dokumente_data = [
            {"id": "1", "document_type": "plan", "gewerk": "KG420_HEIZUNG", 
             "filename": "HZ-01-EG.pdf", "metadaten": {"extrahierter_text": "Detailzeichnung DN 20 Kupfer"}},
            {"id": "2", "document_type": "schema", "gewerk": "KG420_HEIZUNG", 
             "filename": "HZ-Schema.pdf", "metadaten": {"extrahierter_text": "Hydraulisches Schema"}},
            {"id": "3", "document_type": "berechnung", "gewerk": "KG420_HEIZUNG", 
             "filename": "HZ-Berechnung.pdf", "metadaten": {"extrahierter_text": "Heizlastberechnung"}},
        ]
        
        befunde_data = []  # Keine Befunde
        
        result = agent.pruefe_ausfuehrungsreife(projekt_data, dokumente_data, befunde_data)
        
        # Assertions
        assert result["status"] == "ausfuehrungsreif"
        assert result["gesamt_score"] >= 0.85
        assert result["scores"]["vollstaendigkeit"] > 0
        assert result["scores"]["detailgrad"] > 0
        assert "empfehlung" in result
        assert isinstance(result["naechste_schritte"], list)
    
    def test_pruefe_ausfuehrungsreife_unvollstaendig(self, agent, projekt_data):
        """Test: Unvollständige Dokumente führen zu gelbem/rotem Status"""
        # Nur 1 Dokument (unvollständig)
        dokumente_data = [
            {"id": "1", "document_type": "plan", "gewerk": "KG420_HEIZUNG", 
             "filename": "HZ-01-EG.pdf", "metadaten": {"extrahierter_text": "Grundriss"}},
        ]
        
        befunde_data = []
        
        result = agent.pruefe_ausfuehrungsreife(projekt_data, dokumente_data, befunde_data)
        
        # Assertions
        assert result["status"] in ["klaerungsbedarf", "nicht_ausfuehrungsreif"]
        assert result["gesamt_score"] < 0.85
        assert len(result["details"]["vollstaendigkeit"]["fehlende_dokumente"]) > 0
    
    def test_pruefe_ausfuehrungsreife_mit_kritischen_befunden(self, agent, projekt_data):
        """Test: Kritische Befunde reduzieren Score"""
        dokumente_data = [
            {"id": "1", "document_type": "plan", "gewerk": "KG420_HEIZUNG", 
             "filename": "HZ-01-EG.pdf", "metadaten": {"extrahierter_text": "Detailzeichnung"}},
            {"id": "2", "document_type": "schema", "gewerk": "KG420_HEIZUNG", 
             "filename": "HZ-Schema.pdf", "metadaten": {"extrahierter_text": "Schema"}},
        ]
        
        # Kritische Befunde
        befunde_data = [
            {"id": "b1", "beschreibung": "Fehlende Bemaßung", "prioritaet": "HOCH", "kategorie": "TECHNISCH"},
            {"id": "b2", "beschreibung": "Unklare Materialangabe", "prioritaet": "HOCH", "kategorie": "TECHNISCH"},
            {"id": "b3", "beschreibung": "Kollision mit Lüftung", "prioritaet": "HOCH", "kategorie": "KOORDINATION"},
        ]
        
        result = agent.pruefe_ausfuehrungsreife(projekt_data, dokumente_data, befunde_data)
        
        # Assertions
        assert result["status"] in ["klaerungsbedarf", "nicht_ausfuehrungsreif"]
        assert result["gesamt_score"] < 0.85
        assert len(result["naechste_schritte"]) > 0
    
    def test_pruefe_vollstaendigkeit(self, agent, projekt_data):
        """Test: Vollständigkeitsprüfung funktioniert"""
        dokumente_data = [
            {"id": "1", "document_type": "plan", "gewerk": "KG420_HEIZUNG", "filename": "HZ-01-EG.pdf"},
        ]
        
        score, details = agent._pruefe_vollstaendigkeit(projekt_data, dokumente_data)
        
        # Assertions
        assert 0.0 <= score <= 1.0
        assert "fehlende_dokumente" in details
        assert isinstance(details["fehlende_dokumente"], list)
    
    def test_pruefe_detailgrad(self, agent):
        """Test: Detailgrad-Prüfung funktioniert"""
        dokumente_data = [
            {"id": "1", "document_type": "plan", "gewerk": "KG420_HEIZUNG", 
             "metadaten": {"extrahierter_text": "Detailzeichnung DN 20 Kupfer Heizkörper 600x1000"}},
        ]
        
        score, details = agent._pruefe_detailgrad(dokumente_data)
        
        # Assertions
        assert 0.0 <= score <= 1.0
        assert "anzahl_detailzeichnungen" in details
        assert "anzahl_bemaßungen" in details
    
    def test_pruefe_materialspezifikationen(self, agent):
        """Test: Materialspezifikations-Prüfung funktioniert"""
        dokumente_data = [
            {"id": "1", "document_type": "plan", "gewerk": "KG420_HEIZUNG", 
             "metadaten": {"extrahierter_text": "DN 20 Kupfer Heizkörper Kermi Typ 22"}},
        ]
        
        score, details = agent._pruefe_materialspezifikationen(dokumente_data)
        
        # Assertions
        assert 0.0 <= score <= 1.0
        assert "anzahl_spezifikationen" in details
    
    def test_pruefe_schnittstellen(self, agent):
        """Test: Schnittstellen-Prüfung funktioniert"""
        dokumente_data = [
            {"id": "1", "document_type": "sud_plan", "gewerk": "KG400_ALLGEMEIN", "filename": "SuD-Plan.pdf"},
            {"id": "2", "document_type": "koordinationsplan", "gewerk": "KG400_ALLGEMEIN", "filename": "Koordination.pdf"},
        ]
        
        score, details = agent._pruefe_schnittstellen(dokumente_data)
        
        # Assertions
        assert 0.0 <= score <= 1.0
        assert "hat_sud_plan" in details
        assert "hat_koordinationsplan" in details
    
    def test_bestimme_status_gruen(self, agent):
        """Test: Status-Bestimmung für grünen Bereich"""
        status = agent._bestimme_status(0.90)
        assert status == "ausfuehrungsreif"
    
    def test_bestimme_status_gelb(self, agent):
        """Test: Status-Bestimmung für gelben Bereich"""
        status = agent._bestimme_status(0.70)
        assert status == "klaerungsbedarf"
    
    def test_bestimme_status_rot(self, agent):
        """Test: Status-Bestimmung für roten Bereich"""
        status = agent._bestimme_status(0.50)
        assert status == "nicht_ausfuehrungsreif"
    
    def test_generiere_empfehlung(self, agent):
        """Test: Empfehlungs-Generierung funktioniert"""
        empfehlung = agent._generiere_empfehlung("ausfuehrungsreif", 0.90, {})
        assert isinstance(empfehlung, str)
        assert len(empfehlung) > 0
        
        empfehlung = agent._generiere_empfehlung("klaerungsbedarf", 0.70, {})
        assert isinstance(empfehlung, str)
        assert "Klärungsbedarf" in empfehlung
        
        empfehlung = agent._generiere_empfehlung("nicht_ausfuehrungsreif", 0.50, {})
        assert isinstance(empfehlung, str)
        assert "nicht ausführungsreif" in empfehlung
    
    def test_generiere_naechste_schritte(self, agent):
        """Test: Nächste Schritte werden generiert"""
        details = {
            "vollstaendigkeit": {
                "fehlende_dokumente": [
                    {"dokument_typ": "schema", "gewerk": "KG420_HEIZUNG"}
                ]
            },
            "detailgrad": {
                "plaene_ohne_detailzeichnungen": 3
            }
        }
        
        schritte = agent._generiere_naechste_schritte("klaerungsbedarf", details)
        
        # Assertions
        assert isinstance(schritte, list)
        assert len(schritte) > 0
        assert all("aktion" in s and "beschreibung" in s for s in schritte)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

