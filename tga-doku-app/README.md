# TGA Dokumentations-App

Eine umfassende Web-Anwendung für die professionelle Dokumentation von TGA-Begehungen (Technische Gebäudeausrüstung) mit KI-gestützter Analyse und automatischer Berichtserstellung.

## Features

### Kernfunktionalitäten

**Projektmanagement**
- Zentrale Projektverwaltung mit Dashboard
- Statusverfolgung (Vorbereitung → Begehung → Auswertung → Abschluss)
- Rollenbasierte Zugriffskontrolle (Admin, Projektleiter, Bauleiter, Planer)
- Multi-User-Kollaboration mit Kommentarfunktion

**Grundriss-Management**
- Upload von Grundrissen (PDF, JPG, PNG)
- KI-gestützte Raumerkennung und -kategorisierung
- Interaktive Annotation mit Fotopositionen
- Markierung von Blickrichtungen mit Pfeilen
- Unterstützung mehrerer Grundrisse pro Projekt

**Geführter Begehungsprozess**
- Schritt-für-Schritt-Workflow durch Bereiche
- Quick Capture Modus für schnelle Aufnahmen vor Ort
- Foto-Upload mit automatischer Positionszuordnung
- Feststellungen nach KG 410-490 kategorisieren
- Prioritätseinstufung (kritisch, hoch, mittel, niedrig)
- Sprachnotizen und Text-Eingabe

**KI-gestützte Analyse**
- Automatische Bildanalyse und Objekterkennung
- Kategorisierung nach Gewerken (KG410-490)
- Empfehlungen für Maßnahmen und Verantwortlichkeiten
- Fristvorschläge basierend auf Priorität
- Kostenabschätzungen

**Dokumentengenerierung**
- Automatische Word-Dokumente
- Professionelle Präsentationen
- PDF-Export
- Web-Ansicht
- Anpassbare Templates

**Offline-Fähigkeit**
- Progressive Web App (PWA)
- Lokale Datenspeicherung mit IndexedDB
- Automatische Synchronisation bei Online-Verbindung
- Background Sync für Foto-Upload

## Technologie-Stack

### Frontend
- React 19 mit TypeScript
- Tailwind CSS 4 + shadcn/ui
- Wouter für Routing
- TanStack Query für State Management
- IndexedDB für Offline-Speicherung

### Backend
- Node.js mit Express
- tRPC für typsichere API
- Drizzle ORM
- MySQL/TiDB Datenbank
- S3-kompatible Storage für Dateien

### KI-Integration
- OpenAI GPT-4 für Textanalyse
- OpenAI Vision für Bildanalyse
- Canvas API für Grundriss-Annotation

## Installation

```bash
# Dependencies installieren
pnpm install

# Datenbank-Schema migrieren
pnpm db:push

# Entwicklungsserver starten
pnpm dev
```

## Umgebungsvariablen

Kopieren Sie `.env.example` zu `.env` und konfigurieren Sie:

```env
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-secret-key
VITE_APP_TITLE="TGA Dokumentations-App"
OPENAI_API_KEY=your-openai-api-key
```

## Datenbankschema

Die App verwendet folgende Haupttabellen:

- **users** - Benutzerverwaltung mit Rollen
- **projects** - Projektinformationen
- **floorPlans** - Grundrisse mit KI-Analyse
- **rooms** - Erkannte Räume
- **inspections** - Begehungen
- **findings** - Feststellungen mit Position
- **photos** - Fotodokumentation
- **recommendations** - KI-generierte Empfehlungen
- **templates** - Anpassbare Vorlagen
- **reports** - Generierte Berichte
- **comments** - Kollaborations-Kommentare
- **offlineQueue** - Offline-Synchronisation

## Kategorien nach DIN 276

Die App unterstützt alle TGA-Kostengruppen:

- **KG 410** - Abwasser-, Wasser- und Gasanlagen
- **KG 420** - Wärmeversorgungsanlagen
- **KG 430** - Lufttechnische Anlagen
- **KG 440** - Starkstromanlagen
- **KG 450** - Fernmelde- und informationstechnische Anlagen
- **KG 460** - Förderanlagen
- **KG 470** - Nutzungsspezifische Anlagen
- **KG 480** - Gebäudeautomation
- **KG 490** - Sonstige Maßnahmen für technische Anlagen

## Entwicklungsstatus

**Phase 1: Datenbankschema und Architektur** ✅ Abgeschlossen
- Vollständiges Datenbankschema implementiert
- Relationen zwischen Tabellen definiert
- Migrationen erfolgreich durchgeführt

**Phase 2: Dashboard und Projektmanagement** 🚧 In Arbeit
- Projektübersicht
- Benutzerauthentifizierung
- Rollenbasierte Zugriffskontrolle

**Phase 3: Grundriss-Upload und Analyse** 📋 Geplant
- Grundriss-Upload-Interface
- KI-gestützte Raumerkennung
- Interaktive Annotation

**Phase 4: Begehungs-Workflow** 📋 Geplant
- Geführter Modus
- Quick Capture
- Foto-Upload mit Position

**Phase 5: KI-Analyse und Empfehlungen** 📋 Geplant
- Bildanalyse
- Empfehlungs-Engine
- Dokumentengenerierung

**Phase 6: Offline-Fähigkeit** 📋 Geplant
- Service Worker
- IndexedDB Integration
- Background Sync

**Phase 7: Testing und Deployment** 📋 Geplant
- Unit Tests
- Integration Tests
- Produktions-Deployment

## Lizenz

Proprietär - Alle Rechte vorbehalten

## Kontakt

Für Fragen und Support wenden Sie sich bitte an das Entwicklungsteam.

