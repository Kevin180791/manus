# manus - TGA-Plattform für Planungsbüros und ausführende Firmen

**Version**: 2.0.0 (mit Features für ausführende Firmen)  
**Datum**: 13. Oktober 2025  
**Status**: MVP Phase 1 implementiert

---

## 🎯 Vision

Die manus-Plattform ist eine KI-gestützte Lösung zur Qualitätssicherung von Planungsunterlagen in der Technischen Gebäudeausrüstung (TGA). Sie verbindet Planungsbüros und ausführende Firmen durch intelligente Automatisierung und schafft Transparenz, Effizienz und Vertrauen im Bauprozess.

**Kernprinzip**: **Provenance-by-Design** - Jeder Befund, jede Empfehlung ist lückenlos nachvollziehbar.

---

## 🚀 Neue Features für ausführende Firmen

### 1. Ausführungsreife-Prüfung ✅

**Problem**: Bauleiter verlieren Stunden damit, manuell zu prüfen, ob Planungsunterlagen vollständig und ausführungsreif sind.

**Lösung**: Automatische Prüfung in < 5 Minuten mit Ampel-System:
- ✅ **Grün (≥85%)**: Ausführungsreif → AVOR kann starten
- ⚠️ **Gelb (≥60%)**: Klärungsbedarf → Konkrete Handlungsempfehlungen
- ❌ **Rot (<60%)**: Nicht ausführungsreif → Baustellenstart verschieben

**Prüfkriterien**:
1. **Vollständigkeit** (35%): Sind alle Dokumente nach VDI 6026 vorhanden?
2. **Detailgrad** (30%): Sind Detailzeichnungen, Bemaßung, Materialangaben vorhanden?
3. **Materialspezifikationen** (20%): Sind Materialien eindeutig spezifiziert?
4. **Schnittstellen** (15%): Sind SuD-Pläne und Koordinationspläne vorhanden?

**Mehrwert**:
- ⏱️ **Zeitersparnis**: Von 2-3 Stunden auf < 5 Minuten
- 🎯 **Präzision**: Keine übersehenen Details
- 📊 **Transparenz**: Nachvollziehbare Scores und Empfehlungen

---

### 2. Automatische Materiallisten ✅

**Problem**: AVOR-Mitarbeiter verbringen 4-8 Stunden damit, Materialien aus Plänen manuell zu extrahieren und zu zählen.

**Lösung**: Automatische Extraktion und Aggregation in < 30 Minuten:
- 🔍 **Regelbasierte Extraktion**: Heizkörper, Rohrleitungen, Luftauslässe, Kanäle, etc.
- 📦 **Aggregation**: Gleiche Positionen werden zusammengefasst, Mengen summiert
- 📄 **CSV-Export**: Direkt ins ERP importierbar
- 🔗 **Provenance**: Jede Position mit Quelle und Konfidenz

**Unterstützte Gewerke**:
- KG420 Heizung: Heizkörper, Rohrleitungen, Armaturen
- KG430 Lüftung: Luftauslässe, Kanäle
- KG410 Sanitär: Sanitärarmaturen

**Mehrwert**:
- ⏱️ **Zeitersparnis**: Von 4-8 Stunden auf < 30 Minuten
- 🎯 **Genauigkeit**: 90%+ Genauigkeit bei Standardkomponenten
- 💰 **Kostenreduktion**: Weniger Fehlbestellungen

---

## 📋 Architektur

### Backend (Python/FastAPI)

```
backend/
├── agent_core/
│   ├── execution_readiness_agent.py    # Ausführungsreife-Prüfung
│   ├── tga_coordinator.py              # Orchestrierung
│   ├── checks/                         # Gewerk-spezifische Checks
│   │   ├── kg410_sanitary.py
│   │   ├── kg420_heating.py
│   │   ├── kg430_ventilation.py
│   │   └── ...
│   └── ...
├── services/
│   ├── material_list_service.py        # Materiallisten-Generierung
│   ├── bericht_service.py
│   └── ...
├── routers/
│   ├── execution_router.py             # API für ausführende Firmen
│   ├── tga_router.py
│   └── ...
├── models.py                           # Basis-Datenmodelle
├── models_execution.py                 # Execution-Modelle
└── main.py
```

### Frontend (React)

```
frontend/
├── src/
│   ├── components/
│   │   ├── ExecutionDashboard.jsx      # Dashboard für ausführende Firmen
│   │   ├── MaterialListView.jsx        # (TODO)
│   │   └── ...
│   ├── pages/
│   │   ├── ProjectDetails.jsx
│   │   └── ...
│   └── ...
```

### Datenbank (PostgreSQL)

**Neue Tabellen**:
- `ausfuehrungs_reife_pruefungen`: Prüfergebnisse
- `fehlende_dokumente`: Fehlende Dokumente
- `material_listen`: Materiallisten
- `material_positionen`: Einzelne Materialpositionen
- `schnittstellen`: Schnittstellen zwischen Gewerken (vorbereitet)
- `plan_revisionen`: Planversionierung (vorbereitet)
- `plan_aenderungen`: Änderungen zwischen Revisionen (vorbereitet)
- `nachtraege`: Nachträge (vorbereitet)

---

## 🛠️ Installation und Setup

### Voraussetzungen

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Docker (optional)

### Backend-Setup

```bash
cd backend

# Virtual Environment erstellen
python3.11 -m venv venv
source venv/bin/activate  # Linux/Mac
# oder
venv\Scripts\activate  # Windows

# Dependencies installieren
pip install -r requirements.txt

# Umgebungsvariablen setzen
cp .env.example .env
# .env bearbeiten: DATABASE_URL, etc.

# Datenbank-Migrationen
alembic upgrade head

# Server starten
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend-Setup

```bash
cd frontend

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev
```

### Docker-Setup (Alternative)

```bash
# Gesamtes System starten
docker-compose up -d

# Backend: http://localhost:8000
# Frontend: http://localhost:3000
# PostgreSQL: localhost:5432
```

---

## 📖 API-Dokumentation

### Ausführungsreife-Prüfung

**Neue Prüfung starten**:
```http
POST /api/v1/execution/readiness-check
Content-Type: application/json

{
  "projekt_id": "abc-123"
}

Response 200:
{
  "id": "pruefung-xyz",
  "projekt_id": "abc-123",
  "status": "klaerungsbedarf",
  "gesamt_score": 0.72,
  "vollstaendigkeit_score": 0.85,
  "detailgrad_score": 0.65,
  "materialspezifikation_score": 0.70,
  "schnittstellen_score": 0.68,
  "empfehlung": "Die Planungsunterlagen haben Klärungsbedarf...",
  "naechste_schritte": [
    {
      "aktion": "Detailzeichnungen nachfordern",
      "beschreibung": "3 Pläne haben unzureichenden Detailgrad"
    }
  ],
  "anzahl_kritische_befunde": 5,
  "anzahl_fehlende_dokumente": 2,
  "erstellt_am": "2025-10-13T10:30:00Z"
}
```

**Letzte Prüfung abrufen**:
```http
GET /api/v1/execution/readiness-check/{projekt_id}

Response 200: (siehe oben)
```

### Materiallisten

**Materialliste generieren**:
```http
POST /api/v1/execution/material-list
Content-Type: application/json

{
  "projekt_id": "abc-123",
  "gewerk": "KG420_HEIZUNG",
  "use_llm": false
}

Response 200:
{
  "id": "liste-xyz",
  "projekt_id": "abc-123",
  "gewerk": "KG420_HEIZUNG",
  "anzahl_positionen": 47,
  "erstellt_am": "2025-10-13T11:00:00Z",
  "erstellt_von": "MaterialListService"
}
```

**Positionen abrufen**:
```http
GET /api/v1/execution/material-list/{liste_id}

Response 200:
[
  {
    "id": "pos-1",
    "kategorie": "HEIZKOERPER",
    "bezeichnung": "Heizkörper 600x1000",
    "menge": 25.0,
    "einheit": "Stk",
    "abmessungen": "600x1000 mm",
    "material": null,
    "hersteller": null,
    "typ": null,
    "quelle_plan_referenz": "HZ-01-EG.pdf",
    "konfidenz": 0.7
  },
  // ...
]
```

**CSV exportieren**:
```http
GET /api/v1/execution/material-list/{liste_id}/export/csv

Response 200: (CSV-Datei)
```

Vollständige API-Dokumentation: http://localhost:8000/docs (Swagger UI)

---

## 🧪 Testing

### Backend-Tests

```bash
cd backend

# Alle Tests
pytest

# Mit Coverage
pytest --cov=. --cov-report=html

# Spezifische Tests
pytest tests/test_execution_readiness_agent.py
pytest tests/test_material_list_service.py
```

### Frontend-Tests

```bash
cd frontend

# Unit-Tests
npm test

# E2E-Tests
npm run test:e2e
```

---

## 📊 Roadmap

### ✅ Phase 1: MVP (abgeschlossen)

- [x] Ausführungsreife-Prüfung (regelbasiert)
- [x] Automatische Materiallisten (regelbasiert)
- [x] Execution-Dashboard (Frontend)
- [x] API-Endpoints
- [x] Datenmodell-Erweiterungen

### 🚧 Phase 2: KI-Integration (Q1 2026)

- [ ] Computer Vision für OCR und Layout-Analyse
- [ ] LLM-basierte Materialspezifikations-Extraktion
- [ ] Multimodale Dokumentenanalyse
- [ ] RAG-System für Normen und Richtlinien

### 🔮 Phase 3: Erweiterte Features (Q2 2026)

- [ ] Schnittstellen-Management
- [ ] Planrevisions-Vergleich (Diff)
- [ ] Auswirkungsanalyse von Änderungen
- [ ] Nachtragsdokumentation
- [ ] Mobile App (PWA)

### 🌟 Phase 4: Multi-Agent-System (Q3 2026)

- [ ] Temporal.io für Workflow-Orchestrierung
- [ ] Ray für parallele Agent-Ausführung
- [ ] LangGraph für LLM-Agenten-Koordination
- [ ] Monitoring und Observability

---

## 🤝 Beitragen

Wir freuen uns über Beiträge! Bitte beachten Sie:

1. **Issues**: Beschreiben Sie Bugs oder Feature-Requests detailliert
2. **Pull Requests**: 
   - Fork das Repository
   - Erstellen Sie einen Feature-Branch
   - Schreiben Sie Tests
   - Dokumentieren Sie Änderungen
   - Erstellen Sie einen PR mit klarer Beschreibung

### Code-Style

**Backend (Python)**:
- PEP 8
- Type Hints
- Docstrings (Google-Style)

**Frontend (React)**:
- ESLint
- Prettier
- JSDoc für Komponenten

---

## 📄 Lizenz

Proprietär - Alle Rechte vorbehalten

---

## 📞 Support

- **Dokumentation**: `docs/`
- **Issues**: GitHub Issues
- **E-Mail**: support@manus-tga.de

---

## 🙏 Danksagungen

- **VDI 6026**: Grundlage für Vollständigkeitsprüfung
- **OpenAI**: LLM-Integration (geplant)
- **shadcn/ui**: UI-Komponenten
- **FastAPI**: Backend-Framework
- **React**: Frontend-Framework

---

## 📚 Weiterführende Dokumentation

- [Gap-Analyse](docs/gap_analysis_ausfuehrende_firmen.md)
- [User Stories](docs/user_stories_ausfuehrende_firmen.md)
- [Implementierung](docs/IMPLEMENTATION_AUSFUEHRENDE_FIRMEN.md)
- [Frontend-Integration](docs/FRONTEND_INTEGRATION.md)
- [Multi-Agent-System Konzept](docs/Erweiterte_Analyse_und_Konzept_Multi_Agent_System.md)
- [Use Cases und Potenziale](docs/Analyse_Use_Cases_Potenziale_TGA_Plattform.md)

---

**Entwickelt mit ❤️ für die TGA-Branche**

