# Testing Guide - manus TGA-Plattform

**Vollständige Anleitung zum Testen der Plattform mit echten Daten**

---

## 🎯 Vorbereitung

### 1. System starten

**Terminal 1 - Backend**:
```bash
cd ~/manus/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend läuft auf: http://localhost:8000  
📚 API-Docs: http://localhost:8000/docs

**Terminal 2 - Frontend**:
```bash
cd ~/manus/frontend
npm install  # Nur beim ersten Mal
npm run dev
```

✅ Frontend läuft auf: http://localhost:3000

---

## 🧪 Test-Szenarien

### Szenario 1: Vollständiger Workflow (empfohlen für ersten Test)

**Ziel**: Kompletten Workflow von Projekt-Erstellung bis Materialliste durchlaufen

#### Schritt 1: Projekt anlegen

1. Öffne http://localhost:3000
2. Navigiere zu **"🔍 TGA-Planprüfung"**
3. Fülle Projektdaten aus:
   - **Projektname**: "Testprojekt Bürogebäude"
   - **Gebäudetyp**: "Bürogebäude"
   - **Leistungsphase**: "LP5 - Ausführungsplanung"
   - **Beschreibung**: "Test für Ausführungsreife"
4. Klicke **"Weiter zu Schritt 2"**

#### Schritt 2: Dokumente hochladen

1. Klicke **"Dateien auswählen"**
2. Wähle deine TGA-Pläne aus (PDF, DWG)
3. Für jedes Dokument:
   - **Dokumenttyp**: Plan / Berechnung / Schema
   - **Gewerk**: KG420 Heizung / KG430 Lüftung / KG410 Sanitär
   - **Plan-Nr.**: z.B. "HZ-01-EG"
4. Klicke **"Prüfung starten"**

#### Schritt 3: Prüfung überwachen

- Warte, bis Status "abgeschlossen" ist
- Prüfe Befunde nach Priorität (Hoch/Mittel/Niedrig)

#### Schritt 4: Ausführungsreife prüfen

1. Klicke **"🏗️ Zur Ausführungsreife-Prüfung"**
2. Oder wechsle zum Tab **"🏗️ Ausführung"**
3. Klicke **"Jetzt prüfen"**
4. Warte auf Ergebnis

**Erwartetes Ergebnis**:
- ✅ **Grün** (≥85%): Ausführungsreif
- ⚠️ **Gelb** (60-84%): Klärungsbedarf
- ❌ **Rot** (<60%): Nicht ausführungsreif

#### Schritt 5: Materialliste generieren

1. Wechsle zu **"📦 Materiallisten"**
2. Wähle Gewerk (z.B. "KG420 - Heizung")
3. Klicke **"Materialliste generieren"**
4. Warte auf Ergebnis
5. Klicke **"CSV exportieren"**

**Erwartetes Ergebnis**:
- Tabelle mit Materialien (Heizkörper, Rohre, Armaturen)
- CSV-Download funktioniert

---

### Szenario 2: API-Testing (für Entwickler)

**Ziel**: Backend-APIs direkt testen

#### Via Swagger UI

1. Öffne http://localhost:8000/docs
2. Navigiere zu **"execution"**-Endpoints
3. Teste folgende Endpoints:

**A) Ausführungsreife-Prüfung**:
```
POST /api/v1/execution/readiness-check
Body: {"projekt_id": "test-123"}
```

**B) Ergebnis abrufen**:
```
GET /api/v1/execution/readiness-check/{projekt_id}
```

**C) Materialliste generieren**:
```
POST /api/v1/execution/material-list
Body: {
  "projekt_id": "test-123",
  "gewerk": "KG420_HEIZUNG",
  "use_llm": false
}
```

**D) CSV exportieren**:
```
GET /api/v1/execution/material-list/{id}/export/csv
```

#### Via curl

```bash
# 1. Ausführungsreife prüfen
curl -X POST http://localhost:8000/api/v1/execution/readiness-check \
  -H "Content-Type: application/json" \
  -d '{"projekt_id": "test-projekt-123"}'

# 2. Materialliste generieren
curl -X POST http://localhost:8000/api/v1/execution/material-list \
  -H "Content-Type: application/json" \
  -d '{
    "projekt_id": "test-projekt-123",
    "gewerk": "KG420_HEIZUNG",
    "use_llm": false
  }'
```

#### Via Python

```python
import requests

# Backend-URL
BASE_URL = "http://localhost:8000"

# 1. Ausführungsreife prüfen
response = requests.post(
    f"{BASE_URL}/api/v1/execution/readiness-check",
    json={"projekt_id": "test-projekt-123"}
)
result = response.json()

print(f"Status: {result['status']}")
print(f"Score: {result['gesamt_score']}")
print(f"Empfehlung: {result['empfehlung']}")

# 2. Materialliste generieren
response = requests.post(
    f"{BASE_URL}/api/v1/execution/material-list",
    json={
        "projekt_id": "test-projekt-123",
        "gewerk": "KG420_HEIZUNG",
        "use_llm": False
    }
)
material_liste = response.json()

print(f"Materialliste ID: {material_liste['id']}")
print(f"Anzahl Positionen: {len(material_liste['positionen'])}")
```

---

### Szenario 3: Unit-Tests

**Ziel**: Code-Qualität sicherstellen

```bash
cd ~/manus/backend

# Alle Tests
pytest -v

# Nur Execution-Tests
pytest tests/test_execution_readiness_agent.py -v
pytest tests/test_material_list_service.py -v

# Mit Coverage
pytest --cov=. --cov-report=html
```

**Erwartetes Ergebnis**: Alle Tests bestanden ✅

---

## 📊 Was zu testen ist

### Ausführungsreife-Prüfung

**Vollständigkeit** (35% Gewichtung):
- [ ] Werden fehlende Dokumente erkannt?
- [ ] Sind alle Gewerke abgedeckt?

**Detailgrad** (30% Gewichtung):
- [ ] Werden Detailzeichnungen erkannt?
- [ ] Werden Bemaßungen gefunden?

**Materialspezifikationen** (20% Gewichtung):
- [ ] Werden DN-Angaben extrahiert?
- [ ] Werden Materialien (Kupfer, Stahl) erkannt?
- [ ] Werden Abmessungen gefunden?

**Schnittstellen** (15% Gewichtung):
- [ ] Wird SuD-Plan erkannt?
- [ ] Wird Koordinationsplan erkannt?

### Materiallisten-Generierung

**KG420 - Heizung**:
- [ ] Heizkörper mit Abmessungen
- [ ] Rohrleitungen mit DN und Material
- [ ] Armaturen (Kugelhahn, Absperrhahn)
- [ ] Pumpen, Kessel

**KG430 - Lüftung**:
- [ ] Luftauslässe mit Abmessungen
- [ ] Kanäle mit Querschnitt
- [ ] Ventilatoren

**KG410 - Sanitär**:
- [ ] Sanitärobjekte
- [ ] Rohrleitungen
- [ ] Armaturen

**CSV-Export**:
- [ ] Datei wird heruntergeladen
- [ ] Encoding ist korrekt (UTF-8)
- [ ] Spalten sind vollständig

---

## 🐛 Bekannte Einschränkungen

### Regelbasierte Extraktion

Die aktuelle Version nutzt **regelbasierte Extraktion** (Regex-Patterns):

**Funktioniert gut**:
- ✅ Standardisierte Bezeichnungen (z.B. "DN 20", "600x1000")
- ✅ Mengenangaben mit Einheiten (z.B. "15 Stk", "50 m")
- ✅ Gängige Materialien (Kupfer, Stahl, Edelstahl)

**Funktioniert eingeschränkt**:
- ⚠️ Ungewöhnliche Schreibweisen
- ⚠️ Handschriftliche Notizen
- ⚠️ Komplexe Tabellen
- ⚠️ Semantische Zusammenhänge

**Lösung**: LLM-Integration (geplant für Phase 2)

### OCR-Qualität

Wenn Pläne gescannt sind:
- ⚠️ OCR-Fehler möglich
- ⚠️ Niedrige Konfidenz bei schlechter Qualität

**Lösung**: Computer Vision (geplant für Phase 2)

---

## ✅ Erfolgs-Checkliste

Nach dem Test sollten folgende Features funktionieren:

### Backend
- [ ] Server startet ohne Fehler
- [ ] API-Docs sind erreichbar
- [ ] Datenbank-Migrationen funktionieren
- [ ] Unit-Tests bestehen

### Frontend
- [ ] Seite lädt ohne Fehler
- [ ] Navigation funktioniert
- [ ] Projekt kann angelegt werden
- [ ] Dokumente können hochgeladen werden
- [ ] Prüfung läuft durch
- [ ] Ausführungsreife wird angezeigt
- [ ] Materialliste wird generiert
- [ ] CSV-Export funktioniert

### Integration
- [ ] Frontend kommuniziert mit Backend
- [ ] Daten werden korrekt angezeigt
- [ ] Fehler werden behandelt

---

## 📝 Feedback sammeln

Während des Tests, bitte notieren:

### Genauigkeit
- Wie viele Materialien wurden **korrekt** extrahiert?
- Wie viele Materialien wurden **übersehen**?
- Wie viele **Falsch-Positive**?

### Usability
- Ist der Workflow intuitiv?
- Sind die Empfehlungen hilfreich?
- Fehlen wichtige Informationen?

### Performance
- Wie lange dauert die Ausführungsreife-Prüfung?
- Wie lange dauert die Materiallisten-Generierung?
- Gibt es Performance-Probleme?

### Bugs
- Welche Fehler treten auf?
- Unter welchen Bedingungen?
- Reproduzierbar?

---

## 🆘 Troubleshooting

### Problem: Backend startet nicht

**Lösung**:
```bash
cd ~/manus/backend
pip3 install -r requirements.txt
alembic upgrade head
```

### Problem: Frontend lädt nicht

**Lösung**:
```bash
cd ~/manus/frontend
rm -rf node_modules package-lock.json
npm install
```

### Problem: API-Requests schlagen fehl

**Lösung**: Prüfe, ob Backend läuft
```bash
curl http://localhost:8000/docs
```

### Problem: Materialliste ist leer

**Mögliche Ursachen**:
1. Keine Materialien im Plan vorhanden
2. OCR-Extraktion fehlgeschlagen
3. Regex-Patterns passen nicht

**Lösung**: Prüfe extrahierten Text in Datenbank

---

## 📞 Support

Bei Fragen oder Problemen:
1. Prüfe Logs in der Konsole (Backend + Frontend)
2. Prüfe Browser-Console (F12)
3. Prüfe API-Docs: http://localhost:8000/docs

---

**Viel Erfolg beim Testen! 🚀**

