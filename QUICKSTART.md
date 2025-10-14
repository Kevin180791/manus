# Quick Start Guide - manus TGA-Plattform

**Für**: Entwickler, die lokal mit der Plattform arbeiten möchten  
**Zeitaufwand**: ~10 Minuten

---

## 🚀 Schnellstart

### 1. Repository klonen

```bash
git clone https://github.com/Kevin180791/manus.git
cd manus
```

### 2. Backend starten

```bash
cd backend

# Dependencies installieren
pip3 install -r requirements.txt

# Datenbank initialisieren
alembic upgrade head

# Server starten
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend läuft auf: http://localhost:8000  
📚 API-Dokumentation: http://localhost:8000/docs

### 3. Frontend starten (optional)

```bash
cd frontend

# Dependencies installieren
npm install

# Dev-Server starten
npm run dev
```

✅ Frontend läuft auf: http://localhost:3000

---

## 🧪 Features testen

### Ausführungsreife-Prüfung

**Via API (curl)**:

```bash
# Neue Prüfung starten
curl -X POST http://localhost:8000/api/v1/execution/readiness-check \
  -H "Content-Type: application/json" \
  -d '{"projekt_id": "test-projekt-123"}'
```

**Via Python**:

```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/execution/readiness-check",
    json={"projekt_id": "test-projekt-123"}
)

result = response.json()
print(f"Status: {result['status']}")
print(f"Score: {result['gesamt_score']}")
```

**Via Swagger UI**:

1. Öffne http://localhost:8000/docs
2. Navigiere zu `/api/v1/execution/readiness-check`
3. Klicke auf "Try it out"
4. Gib eine `projekt_id` ein
5. Klicke auf "Execute"

### Materialliste generieren

```bash
curl -X POST http://localhost:8000/api/v1/execution/material-list \
  -H "Content-Type: application/json" \
  -d '{
    "projekt_id": "test-projekt-123",
    "gewerk": "KG420_HEIZUNG",
    "use_llm": false
  }'
```

---

## 📝 Testdaten erstellen

### Option 1: Manuell via API

```python
import requests

# 1. Projekt erstellen
projekt = requests.post("http://localhost:8000/api/v1/tga/projekte", json={
    "name": "Testprojekt Bürogebäude",
    "typ": "OFFICE",
    "leistungsphase": "LP5"
}).json()

projekt_id = projekt["id"]

# 2. Dokument hochladen
with open("testplan.pdf", "rb") as f:
    files = {"file": f}
    data = {
        "projekt_id": projekt_id,
        "gewerk": "KG420_HEIZUNG",
        "document_type": "plan"
    }
    requests.post("http://localhost:8000/documents/upload", files=files, data=data)

# 3. Ausführungsreife prüfen
result = requests.post("http://localhost:8000/api/v1/execution/readiness-check", 
                       json={"projekt_id": projekt_id}).json()

print(f"Status: {result['status']}")
print(f"Score: {result['gesamt_score']}")
```

### Option 2: Mit echten Daten (wenn verfügbar)

```bash
# Dokumente in Upload-Ordner kopieren
cp /pfad/zu/deinen/plaenen/*.pdf backend/uploads/

# Dann via API hochladen (siehe Option 1)
```

---

## 🧪 Tests ausführen

```bash
cd backend

# Alle Tests
pytest

# Nur Execution-Tests
pytest tests/test_execution_readiness_agent.py -v
pytest tests/test_material_list_service.py -v

# Mit Coverage
pytest --cov=. --cov-report=html
```

---

## 🔧 Entwicklung

### Backend-Struktur

```
backend/
├── agent_core/              # Agents
│   ├── execution_readiness_agent.py
│   └── ...
├── services/                # Services
│   ├── material_list_service.py
│   └── ...
├── routers/                 # API-Endpoints
│   ├── execution_router.py
│   └── ...
├── models.py                # Basis-Datenmodelle
├── models_execution.py      # Execution-Modelle
├── database.py              # DB-Konfiguration
└── main.py                  # FastAPI-App
```

### Neue Features hinzufügen

**1. Neuen Agent erstellen**:

```python
# backend/agent_core/mein_neuer_agent.py
class MeinNeuerAgent:
    def __init__(self):
        self.name = "MeinNeuerAgent"
        self.version = "1.0.0"
    
    def fuehre_aus(self, daten):
        # Logik hier
        return {"result": "..."}
```

**2. Neuen API-Endpoint erstellen**:

```python
# backend/routers/mein_router.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/mein-feature", tags=["Mein Feature"])

@router.post("/aktion")
async def meine_aktion(data: dict):
    agent = MeinNeuerAgent()
    result = agent.fuehre_aus(data)
    return result
```

**3. Router registrieren**:

```python
# backend/main.py
from routers import mein_router

app.include_router(mein_router.router)
```

**4. Tests schreiben**:

```python
# backend/tests/test_mein_agent.py
def test_mein_agent():
    agent = MeinNeuerAgent()
    result = agent.fuehre_aus({"test": "data"})
    assert result["result"] == "..."
```

---

## 🐛 Troubleshooting

### Problem: `ModuleNotFoundError`

**Lösung**: Dependencies installieren
```bash
cd backend
pip3 install -r requirements.txt
```

### Problem: `alembic.util.exc.CommandError: Can't locate revision identified by '...'`

**Lösung**: Datenbank zurücksetzen
```bash
cd backend
rm tga_platform.db  # SQLite-DB löschen
alembic upgrade head  # Neu erstellen
```

### Problem: `CORS error` im Frontend

**Lösung**: CORS in `backend/main.py` prüfen
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend-URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Problem: Tests schlagen fehl

**Lösung**: pytest installieren
```bash
pip3 install pytest
```

---

## 📚 Weitere Ressourcen

- **API-Dokumentation**: http://localhost:8000/docs
- **Implementierungs-Docs**: `docs/IMPLEMENTATION_AUSFUEHRENDE_FIRMEN.md`
- **User Stories**: `docs/user_stories_ausfuehrende_firmen.md`
- **Roadmap**: `NEXT_STEPS_ROADMAP.md`

---

## 💡 Tipps

1. **Nutze Swagger UI** für schnelles API-Testing: http://localhost:8000/docs
2. **Hot-Reload** ist aktiviert - Änderungen werden automatisch übernommen
3. **Logs** findest du in der Konsole (uvicorn)
4. **SQLite-DB** liegt in `backend/tga_platform.db` (kann mit DB Browser geöffnet werden)

---

**Viel Erfolg! 🚀**

Bei Fragen: Siehe `README_AUSFUEHRENDE_FIRMEN.md` oder `NEXT_STEPS_ROADMAP.md`

