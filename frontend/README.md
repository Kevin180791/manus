# OpenManus TGA Frontend

React + TypeScript + Vite Frontend für die TGA-Planprüfungsplattform.

## Features

### 🔍 TGA-Planprüfung
- Projekt anlegen und Dokumente hochladen
- Automatische Prüfung nach VDI-Normen
- Befunde mit Prioritäten und Empfehlungen

### 🏗️ Ausführungs-Dashboard
- **Ausführungsreife-Prüfung**: Ampel-System (Grün/Gelb/Rot)
- **Materiallisten**: Automatische Generierung und CSV-Export
- Detaillierte Scores für Vollständigkeit, Detailgrad, Materialspezifikationen, Schnittstellen

## Schnellstart

```bash
# Dependencies installieren
npm install

# Dev-Server starten
npm run dev

# Build für Produktion
npm run build
```

## Komponenten

### Pages
- `Dashboard.tsx` - Hauptübersicht
- `TGAPruefung.tsx` - Planprüfung mit Execution-Tab
- `RoomData.tsx` - Raumdaten
- `FlowCalc.tsx` - Strömungsberechnung

### Components
- `ExecutionDashboard.tsx` - Ausführungsreife-Dashboard
- `MaterialListView.tsx` - Materiallisten-Ansicht

## API-Integration

Das Frontend kommuniziert mit dem Backend über `/api/v1/`:

- `POST /api/v1/execution/readiness-check` - Ausführungsreife prüfen
- `GET /api/v1/execution/readiness-check/:projektId` - Ergebnis abrufen
- `POST /api/v1/execution/material-list` - Materialliste generieren
- `GET /api/v1/execution/material-list/:id` - Materialliste abrufen
- `GET /api/v1/execution/material-list/:id/export/csv` - CSV exportieren

## Entwicklung

### Proxy-Konfiguration

Die `vite.config.ts` leitet API-Requests an das Backend weiter:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  }
}
```

### Neue Komponente hinzufügen

1. Erstelle Datei in `src/components/`
2. Importiere in Parent-Komponente
3. Nutze TypeScript-Interfaces für Props

```typescript
interface MyComponentProps {
  data: string;
}

const MyComponent: React.FC<MyComponentProps> = ({ data }) => {
  return <div>{data}</div>;
};

export default MyComponent;
```

## Styling

- **Tailwind CSS** für Utility-First-Styling
- Responsive Design mit `md:` und `lg:` Breakpoints
- Konsistente Farbpalette:
  - Grün: Erfolg, ausführungsreif
  - Gelb: Warnung, Klärungsbedarf
  - Rot: Fehler, nicht ausführungsreif
  - Blau: Primäre Aktionen

## Tests

```bash
# Tests ausführen (wenn konfiguriert)
npm test
```

## Deployment

```bash
# Build erstellen
npm run build

# Build-Ordner: dist/
# Kann mit jedem Static-File-Server gehostet werden
```

## Troubleshooting

### Problem: API-Requests schlagen fehl

**Lösung**: Backend muss laufen auf `http://localhost:8000`

```bash
cd ../backend
uvicorn main:app --reload
```

### Problem: CORS-Fehler

**Lösung**: CORS in `backend/main.py` prüfen

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Problem: TypeScript-Fehler

**Lösung**: Dependencies neu installieren

```bash
rm -rf node_modules package-lock.json
npm install
```

## Technologie-Stack

- **React 18** - UI-Framework
- **TypeScript** - Type-Safety
- **Vite** - Build-Tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation

## Lizenz

Proprietary - OpenManus TGA

