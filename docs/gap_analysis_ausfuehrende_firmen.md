# Gap-Analyse: Fokus auf ausführende Firmen

**Datum**: 13. Oktober 2025  
**Ziel**: Erweiterung der manus-Plattform für die Bedürfnisse ausführender Firmen

## 1. Spezifische Bedürfnisse ausführender Firmen

Ausführende Firmen haben andere Anforderungen als Planungsbüros:

### 1.1 Kernbedürfnisse

1. **Ausführbarkeit der Planung**
   - Sind alle Informationen vorhanden, um mit der Ausführung zu beginnen?
   - Gibt es Widersprüche zwischen Plänen und Leistungsverzeichnis?
   - Sind Materialspezifikationen eindeutig?

2. **Vollständigkeit für Arbeitsvorbereitung (AVOR)**
   - Welche Materialien werden benötigt?
   - Welche Mengen sind erforderlich?
   - Gibt es alle notwendigen Detailzeichnungen?

3. **Koordination mit anderen Gewerken**
   - Wer macht Schlitz und Durchbruch?
   - Welche Schnittstellen gibt es zu anderen Gewerken?
   - Gibt es Kollisionen, die vor Ort zu Problemen führen?

4. **Änderungsmanagement**
   - Welche Planänderungen gab es seit der letzten Version?
   - Wie wirken sich Änderungen auf meine Kalkulation aus?
   - Welche Nachträge sind gerechtfertigt?

5. **Baustellendokumentation**
   - Referenz für Soll-Zustand
   - Abweichungsdokumentation
   - Abnahmeunterlagen

## 2. Bestehende Funktionalität (Ist-Zustand)

### 2.1 Was ist bereits vorhanden?

✅ **Planprüfung für Planungsbüros**
- VDI 6026-Vollständigkeitsprüfung
- Gewerkespezifische Checks (KG410-KG480)
- PDF-Parsing und Textextraktion
- Befund-Generierung mit Prioritäten

✅ **Backend-Infrastruktur**
- FastAPI REST-API
- PostgreSQL-Datenbank
- Agent-System mit TGACoordinator
- Spezialisierte Agents pro Gewerk

✅ **Frontend**
- React-basiertes Web-UI
- Projekt-Dashboard
- Befund-Anzeige

### 2.2 Was fehlt für ausführende Firmen?

❌ **Ausführungsspezifische Prüfungen**
- Prüfung auf Ausführbarkeit
- Materialmengenextraktion
- Detailgrad-Prüfung für LP5

❌ **AVOR-Unterstützung**
- Automatische Materiallisten
- Mengenermittlung aus Plänen
- Schnittstellen zu ERP-Systemen

❌ **Änderungsmanagement**
- Vergleich von Planrevisionen
- Auswirkungsanalyse auf Kalkulation
- Nachtragsdokumentation

❌ **Mobile Zugriff**
- Baustellenzugriff auf Pläne
- Offline-Verfügbarkeit
- Fotodokumentation

❌ **Rollen und Berechtigungen**
- Unterschiedliche Ansichten für Planer vs. Ausführende
- Mandantenfähigkeit
- Datenschutz zwischen Firmen

## 3. Priorisierte Erweiterungen

### Phase 1: Ausführbarkeits-Checks (Quick Win)

**Ziel**: Prüfung, ob Planungsunterlagen ausführungsreif sind

**Neue Checks**:
1. **Detailgrad-Prüfung**: Sind alle erforderlichen Detailzeichnungen vorhanden?
2. **Materialspezifikations-Prüfung**: Sind alle Materialien eindeutig spezifiziert?
3. **Mengenplausibilität**: Stimmen Mengen in Plänen mit LV überein?
4. **Schnittstellenkoordination**: Sind SuD-Pläne mit allen Gewerken abgestimmt?

**Implementierung**:
- Neue Check-Module in `backend/agent_core/checks/`
- Erweiterung des `TGACoordinator` um Ausführungs-Perspektive
- Neuer Agent: `ExecutionReadinessAgent`

**Aufwand**: 2-3 Wochen

---

### Phase 2: AVOR-Unterstützung

**Ziel**: Automatische Materiallisten und Mengenermittlung

**Neue Funktionen**:
1. **Materiallisten-Extraktion**: Aus Plänen und Leistungsverzeichnis
2. **Mengenermittlung**: Automatische Berechnung aus Plänen
3. **Export**: CSV/Excel für ERP-Import

**Implementierung**:
- Neuer Service: `AVORService`
- Integration mit `EnhancedPDFParser`
- Export-Funktionen

**Aufwand**: 3-4 Wochen

---

### Phase 3: Änderungsmanagement

**Ziel**: Vergleich von Planrevisionen und Auswirkungsanalyse

**Neue Funktionen**:
1. **Plan-Diff**: Visueller Vergleich zweier Revisionen
2. **Auswirkungsanalyse**: Welche Gewerke sind betroffen?
3. **Nachtragsdokumentation**: Strukturierte Erfassung von Mehrkosten

**Implementierung**:
- Neuer Service: `RevisionComparisonService`
- Computer Vision für visuellen Diff
- Datenmodell-Erweiterung für Revisionen

**Aufwand**: 4-6 Wochen

---

### Phase 4: Rollen und Berechtigungen

**Ziel**: Mandantenfähigkeit und rollenbasierter Zugriff

**Neue Funktionen**:
1. **Benutzerrollen**: Planer, Ausführender, Bauherr, Admin
2. **Mandanten**: Trennung zwischen Firmen
3. **Berechtigungen**: Wer darf was sehen/ändern?

**Implementierung**:
- Authentifizierung und Autorisierung (OAuth2/JWT)
- Datenmodell-Erweiterung (Mandanten, Rollen)
- Frontend-Anpassungen

**Aufwand**: 3-4 Wochen

---

### Phase 5: Mobile Zugriff (Optional)

**Ziel**: Baustellenzugriff auf Pläne und Befunde

**Neue Funktionen**:
1. **Mobile Web-App**: Responsive Design
2. **Offline-Modus**: Service Worker für Offline-Verfügbarkeit
3. **Fotodokumentation**: Kamera-Integration

**Implementierung**:
- Progressive Web App (PWA)
- Service Worker
- Kamera-API

**Aufwand**: 4-6 Wochen

## 4. Datenmodell-Erweiterungen

### 4.1 Neue Entitäten

```python
# Mandanten
class Tenant(Base):
    id: int
    name: str
    type: str  # "planner", "contractor", "client"
    
# Benutzer mit Rollen
class User(Base):
    id: int
    email: str
    tenant_id: int
    role: str  # "admin", "planner", "contractor", "viewer"
    
# Planrevisionen
class PlanRevision(Base):
    id: int
    project_id: int
    revision_number: str
    revision_date: datetime
    file_path: str
    changes_description: str
    
# Materiallisten
class MaterialList(Base):
    id: int
    project_id: int
    trade: str  # KG410, KG420, etc.
    items: JSON  # [{"material": "Heizkörper", "quantity": 50, "unit": "Stk"}]
    
# Nachträge
class ChangeOrder(Base):
    id: int
    project_id: int
    revision_from: str
    revision_to: str
    description: str
    affected_trades: List[str]
    estimated_cost_impact: float
```

## 5. API-Erweiterungen

### 5.1 Neue Endpoints

```
POST /api/v1/execution/readiness-check
  - Prüft Ausführungsreife eines Projekts
  
GET /api/v1/execution/material-list/{project_id}
  - Liefert Materialliste für AVOR
  
POST /api/v1/execution/compare-revisions
  - Vergleicht zwei Planrevisionen
  
GET /api/v1/execution/change-orders/{project_id}
  - Liefert alle Nachträge eines Projekts
  
POST /api/v1/auth/login
  - Authentifizierung
  
GET /api/v1/users/me
  - Aktueller Benutzer
```

## 6. Frontend-Anpassungen

### 6.1 Neue Views

1. **Ausführungs-Dashboard**
   - Übersicht über ausführungsreife Projekte
   - Status der AVOR-Vorbereitung
   - Offene Punkte vor Baustellenstart

2. **Materiallisten-View**
   - Tabellarische Darstellung
   - Export-Funktion
   - Filterung nach Gewerk

3. **Revisions-Vergleich**
   - Side-by-Side-Ansicht
   - Hervorhebung von Änderungen
   - Auswirkungsanalyse

4. **Nachtrags-Management**
   - Liste aller Nachträge
   - Erfassung neuer Nachträge
   - Status-Tracking

## 7. Technische Schulden und Refactoring

### 7.1 Vor Erweiterungen zu adressieren

1. **Test-Coverage erhöhen**
   - Unit-Tests für alle Agents
   - Integration-Tests für API
   - E2E-Tests für kritische User Journeys

2. **Dokumentation verbessern**
   - API-Dokumentation (OpenAPI/Swagger)
   - Entwickler-Dokumentation
   - Benutzer-Handbuch

3. **Code-Qualität**
   - Linting (pylint, black)
   - Type-Hints konsequent nutzen
   - Code-Reviews etablieren

4. **Performance-Optimierung**
   - Caching für häufige Abfragen
   - Asynchrone Verarbeitung
   - Datenbankindizes

## 8. Nächste Schritte

### Sofort (diese Session)

1. ✅ Gap-Analyse dokumentieren
2. ⏳ User Stories für ausführende Firmen detaillieren
3. ⏳ Datenmodell-Erweiterungen implementieren
4. ⏳ ExecutionReadinessAgent implementieren
5. ⏳ API-Endpoints für Ausführungs-Checks

### Kurzfristig (nächste Woche)

1. AVOR-Service implementieren
2. Frontend-Anpassungen für Ausführungs-Dashboard
3. Tests schreiben
4. Dokumentation aktualisieren

### Mittelfristig (nächster Monat)

1. Änderungsmanagement implementieren
2. Rollen und Berechtigungen
3. Pilotprojekt mit ausführender Firma

## 9. Erfolgskriterien

**Wie messen wir Erfolg?**

1. **Funktional**
   - Ausführende Firma kann innerhalb von 5 Minuten feststellen, ob Planung ausführungsreif ist
   - Materialliste kann automatisch generiert und in ERP importiert werden
   - Planänderungen werden automatisch erkannt und bewertet

2. **Technisch**
   - API-Response-Zeit < 2 Sekunden
   - 80%+ Test-Coverage
   - Keine kritischen Security-Issues

3. **Geschäftlich**
   - 3-5 Pilotfirmen nutzen die Plattform
   - Positive Feedback-Scores (NPS > 40)
   - Messbare Zeitersparnis (> 50% bei AVOR)

