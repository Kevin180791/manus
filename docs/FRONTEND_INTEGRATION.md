# Frontend-Integration: Ausführende Firmen

**Komponenten**: React-Komponenten für Ausführungs-Dashboard  
**Datum**: 13. Oktober 2025

## Übersicht

Diese Dokumentation beschreibt die Frontend-Integration der Features für ausführende Firmen. Der Fokus liegt auf der **ExecutionDashboard**-Komponente, die den Ausführungsreife-Status visualisiert.

## Implementierte Komponenten

### 1. ExecutionDashboard

**Pfad**: `frontend/src/components/ExecutionDashboard.jsx`

**Zweck**: Zentrale Dashboard-Ansicht für ausführende Firmen

**Features**:
- ✅ Ausführungsreife-Status mit Ampel-System (Grün/Gelb/Rot)
- ✅ Gesamtscore und Detail-Scores (Vollständigkeit, Detailgrad, Materialspez., Schnittstellen)
- ✅ Kritische Befunde und fehlende Dokumente
- ✅ Empfehlungen und nächste Schritte
- ✅ Aktionen: Erneut prüfen, Bericht exportieren
- 🚧 Materiallisten-Sektion (vorbereitet)

**Props**:
```jsx
<ExecutionDashboard projektId="projekt-123" />
```

**State Management**:
- `readinessData`: Ausführungsreife-Daten vom Backend
- `materialLists`: Liste der Materiallisten (TODO)
- `loading`: Ladezustand
- `error`: Fehlermeldungen

**API-Calls**:
```javascript
// Ausführungsreife-Daten laden
GET /api/v1/execution/readiness-check/{projektId}

// Neue Prüfung starten
POST /api/v1/execution/readiness-check
  Body: { "projekt_id": "..." }
```

---

## Integration in bestehendes Frontend

### 1. Komponente importieren

In `frontend/src/pages/ProjectDetails.jsx`:

```jsx
import ExecutionDashboard from '@/components/ExecutionDashboard';

// ...

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Übersicht</TabsTrigger>
    <TabsTrigger value="documents">Dokumente</TabsTrigger>
    <TabsTrigger value="findings">Befunde</TabsTrigger>
    <TabsTrigger value="execution">Ausführung</TabsTrigger>
  </TabsList>
  
  <TabsContent value="overview">
    {/* Bestehende Übersicht */}
  </TabsContent>
  
  <TabsContent value="documents">
    {/* Bestehende Dokumenten-Ansicht */}
  </TabsContent>
  
  <TabsContent value="findings">
    {/* Bestehende Befunde-Ansicht */}
  </TabsContent>
  
  <TabsContent value="execution">
    <ExecutionDashboard projektId={projektId} />
  </TabsContent>
</Tabs>
```

### 2. UI-Komponenten

Die ExecutionDashboard-Komponente nutzt shadcn/ui-Komponenten:

```bash
# Falls noch nicht installiert
npx shadcn-ui@latest add card
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add button
```

### 3. Icons

Verwendet `lucide-react` Icons:

```bash
npm install lucide-react
```

---

## Visuelle Gestaltung

### Ampel-System

**Grün (≥85%)**: Ausführungsreif
```jsx
<CheckCircle2 className="h-8 w-8 text-green-500" />
<Badge variant="success">Ausführungsreif</Badge>
```

**Gelb (≥60%)**: Klärungsbedarf
```jsx
<AlertTriangle className="h-8 w-8 text-yellow-500" />
<Badge variant="warning">Klärungsbedarf</Badge>
```

**Rot (<60%)**: Nicht ausführungsreif
```jsx
<XCircle className="h-8 w-8 text-red-500" />
<Badge variant="destructive">Nicht ausführungsreif</Badge>
```

### Score-Visualisierung

**Gesamtscore**: Großer Progress-Bar mit Prozentanzeige
```jsx
<div className="w-full bg-gray-200 rounded-full h-3">
  <div
    className="h-3 rounded-full bg-green-500"
    style={{ width: '85%' }}
  ></div>
</div>
```

**Detail-Scores**: 4 Score-Karten in Grid-Layout
```jsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <ScoreCard title="Vollständigkeit" score={0.85} />
  <ScoreCard title="Detailgrad" score={0.65} />
  <ScoreCard title="Materialspez." score={0.70} />
  <ScoreCard title="Schnittstellen" score={0.68} />
</div>
```

### Nächste Schritte

Nummerierte Liste mit Aktionen:
```jsx
<div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full">
    1
  </div>
  <div>
    <p className="font-medium">Detailzeichnungen nachfordern</p>
    <p className="text-sm text-gray-600">3 Pläne haben unzureichenden Detailgrad</p>
  </div>
</div>
```

---

## Zukünftige Erweiterungen

### 1. Materiallisten-Komponente

**Pfad**: `frontend/src/components/MaterialListView.jsx` (TODO)

**Features**:
- Tabellarische Darstellung der Materialpositionen
- Filterung nach Kategorie
- Sortierung nach Bezeichnung, Menge
- Export als CSV
- Bearbeitung und Validierung

**Beispiel**:
```jsx
<MaterialListView 
  projektId="projekt-123" 
  gewerk="KG420_HEIZUNG" 
/>
```

### 2. Revisions-Vergleich

**Pfad**: `frontend/src/components/RevisionCompare.jsx` (TODO)

**Features**:
- Side-by-Side-Ansicht zweier Planrevisionen
- Hervorhebung von Änderungen
- Diff-Visualisierung
- Auswirkungsanalyse

### 3. Mobile Ansicht

**Responsive Design**:
- Bereits implementiert mit Tailwind CSS
- Grid-Layout passt sich an Bildschirmgröße an
- Touch-optimierte Buttons

**PWA** (TODO):
- Service Worker für Offline-Verfügbarkeit
- Installierbar auf Mobilgeräten
- Push-Benachrichtigungen bei Planänderungen

---

## Styling-Richtlinien

### Farbschema

**Status-Farben**:
- Grün: `text-green-600`, `bg-green-500`
- Gelb: `text-yellow-600`, `bg-yellow-500`
- Rot: `text-red-600`, `bg-red-500`
- Blau (Aktionen): `bg-blue-500`, `bg-blue-50`

**Graustufen**:
- Text: `text-gray-600`, `text-gray-900`
- Hintergrund: `bg-gray-50`, `bg-gray-200`
- Border: `border-gray-300`

### Spacing

**Konsistente Abstände**:
- Kleine Abstände: `space-y-2`, `gap-2` (8px)
- Mittlere Abstände: `space-y-4`, `gap-4` (16px)
- Große Abstände: `space-y-6`, `gap-6` (24px)

### Typography

**Überschriften**:
- H2: `text-2xl font-bold`
- H3: `text-lg font-semibold`
- H4: `font-semibold`

**Text**:
- Normal: `text-base`
- Klein: `text-sm`
- Label: `text-sm text-gray-600`

---

## Testing

### Unit-Tests (TODO)

```javascript
// ExecutionDashboard.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import ExecutionDashboard from './ExecutionDashboard';

test('zeigt Ladezustand an', () => {
  render(<ExecutionDashboard projektId="test-123" />);
  expect(screen.getByText(/Lade Ausführungsdaten/i)).toBeInTheDocument();
});

test('zeigt Ausführungsreife-Status an', async () => {
  // Mock API
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        status: 'ausfuehrungsreif',
        gesamt_score: 0.87,
        // ...
      })
    })
  );

  render(<ExecutionDashboard projektId="test-123" />);
  
  await waitFor(() => {
    expect(screen.getByText(/Ausführungsreif/i)).toBeInTheDocument();
    expect(screen.getByText(/87%/i)).toBeInTheDocument();
  });
});
```

### E2E-Tests (TODO)

```javascript
// cypress/e2e/execution-dashboard.cy.js
describe('Execution Dashboard', () => {
  it('führt Ausführungsreife-Prüfung durch', () => {
    cy.visit('/projects/test-123');
    cy.contains('Ausführung').click();
    cy.contains('Ausführungsreife prüfen').click();
    cy.contains('Ausführungsreif', { timeout: 10000 }).should('be.visible');
  });
});
```

---

## Performance-Optimierung

### 1. Lazy Loading

```jsx
import { lazy, Suspense } from 'react';

const ExecutionDashboard = lazy(() => import('./components/ExecutionDashboard'));

// In Parent-Komponente
<Suspense fallback={<LoadingSpinner />}>
  <ExecutionDashboard projektId={projektId} />
</Suspense>
```

### 2. Memoization

```jsx
import { useMemo } from 'react';

const ExecutionDashboard = ({ projektId }) => {
  const statusIcon = useMemo(() => getStatusIcon(readinessData?.status), [readinessData]);
  // ...
};
```

### 3. Debouncing

```jsx
import { useDebounce } from '@/hooks/useDebounce';

const debouncedRefresh = useDebounce(() => {
  fetchExecutionData();
}, 500);
```

---

## Accessibility (a11y)

### ARIA-Labels

```jsx
<Button aria-label="Ausführungsreife erneut prüfen">
  Erneut prüfen
</Button>
```

### Keyboard-Navigation

- Alle interaktiven Elemente sind mit Tab erreichbar
- Enter/Space aktiviert Buttons
- Escape schließt Modals

### Screen-Reader-Support

```jsx
<div role="status" aria-live="polite">
  {loading ? 'Lade Daten...' : 'Daten geladen'}
</div>
```

---

## Troubleshooting

### Problem: API-Fehler 404

**Ursache**: Noch keine Ausführungsreife-Prüfung durchgeführt

**Lösung**: Komponente zeigt "Noch keine Prüfung durchgeführt"-Zustand

### Problem: CORS-Fehler

**Ursache**: Backend-CORS-Konfiguration

**Lösung**: In `backend/main.py`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Problem: Langsame Ladezeiten

**Ursache**: Große Datenmengen, keine Caching

**Lösung**: 
- Backend-Caching implementieren
- Frontend-State-Management (React Query)
- Pagination für große Listen

---

## Nächste Schritte

1. ✅ ExecutionDashboard-Komponente implementiert
2. 🚧 MaterialListView-Komponente
3. 🚧 RevisionCompare-Komponente
4. 🚧 Unit-Tests schreiben
5. 🚧 E2E-Tests mit Cypress
6. 🚧 PWA-Features (Service Worker, Offline-Modus)
7. 🚧 Mobile-Optimierung testen

---

## Kontakt

Bei Fragen zur Frontend-Integration:
- Dokumentation: `docs/IMPLEMENTATION_AUSFUEHRENDE_FIRMEN.md`
- Komponente: `frontend/src/components/ExecutionDashboard.jsx`

