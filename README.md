# TGA-KI-Plattform

Ein Multi-Agent-System für die automatische Prüfung von TGA-Planungsdokumenten (Kostengruppe 400).

## Was das System KANN ✅

### Sofort funktionsfähig:
- **Projektmanagement**: Strukturierte Erfassung von TGA-Projekten nach Gebäudetyp und Leistungsphase
- **Dokumenten-Upload**: Kategorisierung nach Gewerk und Dokumenttyp
- **Workflow-Tracking**: 4-Schritt-Prüfprozess mit Statusverfolgung
- **PDF-Textanalyse**: Extraktion von Text und Tabellen aus PDF-Dokumenten
- **Grundlegende Prüflogik**: Regelbasierte Validierung von Heizlast- und Luftmengendaten
- **Web-Interface**: Vollständige React-Anwendung mit responsivem Design

### Unterstützte Gebäudetypen:
- Bürogebäude (ASR A3.6, VDI 6040)
- Schulen (DIN EN 16798-1)
- Krankenhäuser (DIN 1946-4)
- Industriebauten (VDI 2262)
- Wohngebäude (DIN 1946-6)

### TGA-Gewerke:
- KG410: Sanitär, Abwasser, Wasser, Gas
- KG420: Wärmeversorgungsanlagen
- KG430: Raumlufttechnische Anlagen
- KG440: Elektrische Anlagen
- KG450: Kommunikationstechnik
- KG474: Feuerlöschanlagen
- KG480: Gebäudeautomation

## Was das System NICHT KANN ❌

### Aktuell nicht implementiert:
- **Echte KI-Analyse**: Keine LLM-Integration, keine Computer Vision
- **3D-Koordination**: Keine BIM-Integration oder 3D-Kollisionsprüfung
- **CAD-Dateien**: Nur PDF-Analyse, keine DWG/DXF-Unterstützung
- **Produktive Datenbank**: Daten gehen bei Neustart verloren
- **Benutzer-Management**: Keine Authentifizierung oder Mandantenfähigkeit
- **Automatische Berichtsgenerierung**: PDF-Export ist vorbereitet, aber nicht implementiert

## Installation und Start

### Voraussetzungen:
- Docker und Docker Compose
- Python 3.11+ (für lokale Entwicklung)
- Node.js 18+ (für Frontend-Entwicklung)

### Schnellstart:
```bash
# Repository klonen
git clone <repository-url>
cd manus

# System starten
docker-compose up -d

# Zugriff auf:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8001
# API Docs: http://localhost:8001/docs
```

### Lokale Entwicklung:
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Frontend
cd frontend
npm install
npm start
```

### Tests für die Regelwerke:
Die automatisierten Prüflogiken lassen sich mit `pytest` gegen minimal aufgebaute Kontexte testen. Die wichtigsten Befehle für die lokale Ausführung sind:

```bash
# alle Gewerke-Regeln überprüfen
pytest -q backend/tests

# deterministische Fallbacks (Embeddings, LLM) aktivieren
TEST_MODE=1 pytest -q backend/tests
```

Die Test-Suite ruft die jeweiligen `evaluate`-Funktionen pro Gewerk (Heizung, Lüftung, Elektro, Sprinkler, Gebäudeautomation) direkt auf und prüft sowohl Positiv- als auch Negativfälle für jede Regel.

## API-Endpunkte

### Projekt-Management:
```
POST /api/v1/tga/projekte/erstellen
POST /api/v1/tga/dokumente/upload/{projekt_id}
POST /api/v1/tga/pruefung/starten/{projekt_id}
```

### Status und Ergebnisse:
```
GET /api/v1/tga/pruefung/status/{auftrag_id}
GET /api/v1/tga/pruefung/ergebnisse/{auftrag_id}
GET /api/v1/tga/pruefung/bericht/{auftrag_id}
```

### Metadaten:
```
GET /api/v1/tga/gewerke
GET /api/v1/tga/projekt-typen
GET /api/v1/tga/leistungsphasen
```

## Beispiel-Workflow

1. **Projekt anlegen**:
   ```json
   {
     "projekt_name": "Bürogebäude Musterstraße",
     "projekt_typ": "buerogebaeude",
     "leistungsphase": "entwurfsplanung"
   }
   ```

2. **PDF-Dokumente hochladen** (Heizlastberechnung, RLT-Pläne, etc.)

3. **Prüfung starten** - System analysiert automatisch:
   - PDF-Text und Tabellen
   - Heizlastdaten nach DIN EN 12831-1
   - Luftmengen nach gebäudetypspezifischen Anforderungen
   - Formale Vollständigkeit

4. **Ergebnisse abrufen**:
   ```json
   {
     "befunde": [
       {
         "titel": "Zu geringe Außenluftmenge in Büro 1.01",
         "prioritaet": "hoch",
         "norm_referenz": "ASR A3.6",
         "empfehlung": "Außenluftvolumenstrom erhöhen"
       }
     ]
   }
   ```

## Entwicklungsstand

### ✅ Produktionsreif:
- REST-API-Struktur
- Frontend-Workflow
- PDF-Textextraktion
- Grundlegende Validierung

### ⚠️ Prototyp-Stadium:
- Prüflogik (regelbasiert, nicht KI)
- Dokumentenerkennung (einfache Regex)
- Koordinationsprüfung (Beispiele)

### ❌ Nicht implementiert:
- Datenpersistierung
- Benutzer-Management
- Produktive Skalierung
- Erweiterte KI-Features

## Nächste Entwicklungsschritte

### Phase 1 (2-4 Wochen):
1. **PostgreSQL-Integration** für Datenpersistierung
2. **Erweiterte PDF-Analyse** für komplexere Dokumente
3. **Unit-Tests** für kritische Funktionen
4. **Error-Handling** verbessern

### Phase 2 (4-8 Wochen):
1. **OCR-Integration** für gescannte Pläne
2. **Erweiterte Prüfregeln** pro Gewerk
3. **PDF-Berichtsgenerierung**
4. **Performance-Optimierung**

### Phase 3 (4-6 Wochen):
1. **Benutzer-Management** und Authentifizierung
2. **Mandantenfähigkeit**
3. **Deployment-Pipeline**
4. **Monitoring und Logging**

## Technische Architektur

### Backend (Python/FastAPI):
```
backend/
├── main.py                 # FastAPI-Anwendung
├── agent_core/            # Multi-Agent-System
│   ├── tga_coordinator.py # Zentrale Steuerung
│   ├── heizung_expert.py  # Heizungs-Fachprüfung
│   ├── lueftung_expert.py # Lüftungs-Fachprüfung
│   └── document_parser.py # PDF-Analyse
└── routers/
    └── tga_router.py      # API-Endpunkte
```

### Frontend (React/TypeScript):
```
frontend/src/
├── App.tsx                # Hauptanwendung
├── pages/
│   ├── Dashboard.tsx      # Übersicht
│   └── TGAPruefung.tsx   # Prüf-Workflow
```

## Beitragen

Das System ist als Basis für weitere Entwicklung konzipiert. Beiträge sind willkommen:

1. **Issues** für Bugs und Feature-Requests
2. **Pull Requests** für Verbesserungen
3. **Dokumentation** für bessere Verständlichkeit

## Lizenz

[Lizenz hier einfügen]

## Kontakt

[Kontaktinformationen hier einfügen]

---

**Wichtiger Hinweis**: Dies ist ein Entwicklungsprototyp, kein produktionsreifes System. Für den produktiven Einsatz sind weitere Entwicklungsarbeiten erforderlich.

