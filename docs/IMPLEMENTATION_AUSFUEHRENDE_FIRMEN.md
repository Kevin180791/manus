# Implementierung: Features für ausführende Firmen

**Status**: Phase 1 (MVP) implementiert  
**Datum**: 13. Oktober 2025

## Übersicht

Diese Implementierung erweitert die manus-Plattform um Features speziell für ausführende Firmen. Der Fokus liegt auf der **Ausführungsreife-Prüfung** und der **automatischen Generierung von Materiallisten** für die Arbeitsvorbereitung (AVOR).

## Implementierte Features

### 1. Ausführungsreife-Prüfung

**Zweck**: Schnelle Bewertung, ob Planungsunterlagen ausführungsreif sind

**Komponenten**:
- `backend/agent_core/execution_readiness_agent.py` - Agent für Ausführungsreife-Prüfung
- `backend/models_execution.py` - Datenmodelle (AusfuehrungsReifePruefung, FehlendesDokument)
- `backend/routers/execution_router.py` - API-Endpoints

**Funktionalität**:
1. Prüft Vollständigkeit der Dokumente nach VDI 6026
2. Bewertet Detailgrad der Pläne (Detailzeichnungen, Bemaßung, Materialangaben)
3. Analysiert Materialspezifikationen
4. Prüft Schnittstellen zwischen Gewerken
5. Berechnet Gesamtscore und bestimmt Status:
   - ✅ **Grün** (≥85%): Ausführungsreif
   - ⚠️ **Gelb** (≥60%): Klärungsbedarf
   - ❌ **Rot** (<60%): Nicht ausführungsreif
6. Generiert Empfehlungen und nächste Schritte

**API-Endpoints**:
```
POST /api/v1/execution/readiness-check
  Request: { "projekt_id": "..." }
  Response: ExecutionReadinessResponse mit Status, Scores, Empfehlungen

GET /api/v1/execution/readiness-check/{projekt_id}
  Response: Letzte Ausführungsreife-Prüfung für Projekt
```

**Beispiel-Response**:
```json
{
  "id": "abc-123",
  "projekt_id": "projekt-xyz",
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

---

### 2. Automatische Materiallisten

**Zweck**: Extraktion von Materialien aus Plänen für AVOR

**Komponenten**:
- `backend/services/material_list_service.py` - Service für Materiallisten-Generierung
- `backend/models_execution.py` - Datenmodelle (MaterialListe, MaterialPosition)
- `backend/routers/execution_router.py` - API-Endpoints

**Funktionalität**:
1. Extrahiert Materialien aus Plänen (regelbasiert mit Regex)
2. Unterstützt gewerk-spezifische Extraktion:
   - **KG420 Heizung**: Heizkörper, Rohrleitungen, Armaturen
   - **KG430 Lüftung**: Luftauslässe, Kanäle
   - **KG410 Sanitär**: Sanitärarmaturen
3. Aggregiert gleiche Positionen und summiert Mengen
4. Speichert Herkunft (Quelle-Dokument, Konfidenz)
5. Export als CSV für ERP-Import

**API-Endpoints**:
```
POST /api/v1/execution/material-list
  Request: { "projekt_id": "...", "gewerk": "KG420_HEIZUNG", "use_llm": false }
  Response: MaterialListResponse mit ID und Metadaten

GET /api/v1/execution/material-list/{liste_id}
  Response: Liste aller MaterialPositionen

GET /api/v1/execution/material-list/{liste_id}/export/csv
  Response: CSV-Datei zum Download
```

**Beispiel-Response** (Positionen):
```json
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
  {
    "id": "pos-2",
    "kategorie": "ROHRLEITUNGEN",
    "bezeichnung": "Rohrleitung DN 20",
    "menge": 150.0,
    "einheit": "m",
    "abmessungen": "DN 20",
    "material": "Kupfer",
    "quelle_plan_referenz": "HZ-01-EG.pdf",
    "konfidenz": 0.6
  }
]
```

---

## Datenmodell-Erweiterungen

Neue Tabellen in `backend/models_execution.py`:

### AusfuehrungsReifePruefung
- `id`, `projekt_id`, `status`
- Scores: `vollstaendigkeit_score`, `detailgrad_score`, `materialspezifikation_score`, `schnittstellen_score`, `gesamt_score`
- `empfehlung`, `naechste_schritte` (JSON)
- `anzahl_kritische_befunde`, `anzahl_fehlende_dokumente`
- `erstellt_am`, `geprueft_von`

### FehlendesDokument
- `id`, `pruefung_id`
- `dokument_typ`, `gewerk`, `beschreibung`, `prioritaet`, `grund`

### MaterialListe
- `id`, `projekt_id`, `gewerk`
- `erstellt_am`, `aktualisiert_am`, `erstellt_von`
- `validiert`, `validiert_von`, `validiert_am`

### MaterialPosition
- `id`, `liste_id`
- `kategorie`, `bezeichnung`, `hersteller`, `typ`, `artikelnummer`
- `menge`, `einheit`, `abmessungen`, `material`, `spezifikation`
- `quelle_dokument_id`, `quelle_plan_referenz`, `extraktionsmethode`, `konfidenz`
- `einheitspreis`, `gesamtpreis` (optional)

### Weitere Modelle (vorbereitet für Phase 2+)
- `Schnittstelle` - Schnittstellen zwischen Gewerken
- `PlanRevision` - Versionierung von Plänen
- `PlanAenderung` - Änderungen zwischen Revisionen
- `Nachtrag` - Nachträge aufgrund von Planänderungen

---

## Integration in bestehendes System

### 1. Datenbank-Migration

```bash
# Neue Modelle zur Datenbank hinzufügen
cd backend
alembic revision --autogenerate -m "Add execution models"
alembic upgrade head
```

### 2. Router registrieren

In `backend/main.py`:
```python
from routers import execution_router

app.include_router(execution_router.router)
```

### 3. Abhängigkeiten

Keine neuen Python-Pakete erforderlich. Alle Features nutzen bestehende Dependencies.

---

## Nutzung

### Beispiel 1: Ausführungsreife prüfen

```python
import requests

# Ausführungsreife-Prüfung starten
response = requests.post(
    "http://localhost:8000/api/v1/execution/readiness-check",
    json={"projekt_id": "mein-projekt-123"}
)

result = response.json()
print(f"Status: {result['status']}")
print(f"Gesamtscore: {result['gesamt_score']}")
print(f"Empfehlung: {result['empfehlung']}")

# Ampel-Logik
if result['status'] == 'ausfuehrungsreif':
    print("✅ Grün: Kann mit AVOR beginnen")
elif result['status'] == 'klaerungsbedarf':
    print("⚠️ Gelb: Klärungsbedarf vorhanden")
else:
    print("❌ Rot: Nicht ausführungsreif")
```

### Beispiel 2: Materialliste generieren

```python
import requests

# Materialliste generieren
response = requests.post(
    "http://localhost:8000/api/v1/execution/material-list",
    json={
        "projekt_id": "mein-projekt-123",
        "gewerk": "KG420_HEIZUNG",
        "use_llm": False
    }
)

liste = response.json()
liste_id = liste['id']

# Positionen abrufen
positionen = requests.get(
    f"http://localhost:8000/api/v1/execution/material-list/{liste_id}"
).json()

for pos in positionen:
    print(f"{pos['menge']} {pos['einheit']} {pos['bezeichnung']}")

# CSV exportieren
csv_response = requests.get(
    f"http://localhost:8000/api/v1/execution/material-list/{liste_id}/export/csv"
)

with open("materialliste.csv", "wb") as f:
    f.write(csv_response.content)
```

---

## Limitationen und nächste Schritte

### Aktuelle Limitationen

1. **Regelbasierte Extraktion**: Materiallisten-Extraktion nutzt derzeit nur Regex-Patterns. Genauigkeit ist limitiert.
2. **Keine Computer Vision**: Detailgrad-Prüfung basiert auf Textanalyse, nicht auf visueller Analyse der Pläne.
3. **Keine LLM-Integration**: LLM-basierte Extraktion ist vorbereitet, aber noch nicht implementiert.
4. **Keine Mengenberechnung**: Leitungslängen und Flächen werden nicht automatisch aus Plänen berechnet.

### Nächste Schritte (Phase 2)

1. **Computer Vision Integration**
   - OCR für Planköpfe, Legenden, Beschriftungen
   - Layout-Analyse für Detailzeichnungen
   - Geometrie-Extraktion für Mengenberechnung

2. **LLM-Integration**
   - Semantische Materialspezifikations-Extraktion
   - Widerspruchserkennung zwischen Dokumenten
   - Natürlichsprachliche Erklärungen

3. **Schnittstellen-Management**
   - Automatische Identifikation von Schnittstellen
   - SuD-Plan-Analyse
   - Koordinations-Dashboard

4. **Änderungsmanagement**
   - Plan-Diff (visueller Vergleich)
   - Auswirkungsanalyse
   - Nachtragsdokumentation

---

## Tests

### Unit-Tests

```bash
cd backend
pytest tests/test_execution_readiness_agent.py
pytest tests/test_material_list_service.py
```

### Integration-Tests

```bash
pytest tests/test_execution_router.py
```

### Manuelle Tests

1. Projekt mit Testdaten anlegen
2. Dokumente hochladen
3. Ausführungsreife-Prüfung durchführen
4. Materialliste generieren
5. CSV exportieren

---

## Performance

**Ausführungsreife-Prüfung**:
- Typisches Projekt (50 Dokumente): ~2-5 Sekunden
- Großes Projekt (200 Dokumente): ~10-15 Sekunden

**Materiallisten-Generierung**:
- Regelbasiert: ~1-3 Sekunden pro Gewerk
- Mit LLM (geplant): ~10-30 Sekunden pro Gewerk

---

## Sicherheit und Datenschutz

- Alle Daten werden in der Projekt-Datenbank gespeichert
- Keine externen API-Calls (außer bei LLM-Nutzung)
- Provenance: Jede Material-Position hat Herkunftsnachweis
- Audit-Trail: Alle Prüfungen werden mit Zeitstempel und Agent-Name gespeichert

---

## Kontakt und Support

Bei Fragen zur Implementierung:
- Dokumentation: `docs/gap_analysis_ausfuehrende_firmen.md`
- User Stories: `docs/user_stories_ausfuehrende_firmen.md`
- Code: `backend/agent_core/execution_readiness_agent.py`

