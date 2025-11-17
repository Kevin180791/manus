# Enterprise Management Platform

Eine umfassende Webanwendung für Unternehmensprozessmanagement mit Fokus auf Bau- und Projektleitung.

## 🚀 Features

### Kernfunktionen
- **Mitarbeiterverwaltung** - Vollständige CRUD-Funktionalität mit Status-Tracking
- **Inventarverwaltung** - Werkzeuge, IT-Geräte, Fahrzeuge mit Zuweisungsfunktion
- **Projektmanagement** - Projekte mit integrierten Aufgaben, Dokumenten und Teammitgliedern
- **Zuordnungsverwaltung** - Übersicht aller Inventarzuordnungen mit Filterung

### Dokumentationsfunktionen
- **Bautagebuch** - Tägliche Baustellendokumentation mit Foto-Upload (bis zu 20 Bilder)
- **Begehungsprotokolle** - Strukturierte Begehungsdokumentation
- **Mängelprotokoll** - Erfassung und Verwaltung von Mängeln

### Projektmanagement-Tools
- **Aufgaben-System** - Flexibles Task-Management mit verschiedenen Typen (Aufgabe, RFI, Mangel, Frage)
- **Dokumentenverwaltung** - Projektbezogene Dokumente
- **Aufmaße** - Bauaufmaß-Erfassung
- **Kapazitätenplanung** - Ressourcenplanung für Mitarbeiter

### Technische Features
- **Authentifizierung** - Manus OAuth Integration
- **Benachrichtigungssystem** - Automatische Benachrichtigungen bei wichtigen Ereignissen
- **KI-Integration** - OpenRouter für intelligente Funktionen (Analysen, Zusammenfassungen)
- **Export-Funktionen** - PDF und PowerPoint Export (vorbereitet)

## 🛠️ Tech Stack

- **Frontend:** React 19, Tailwind CSS 4, shadcn/ui
- **Backend:** Express 4, tRPC 11
- **Datenbank:** MySQL/TiDB mit Drizzle ORM
- **Authentifizierung:** Manus OAuth
- **File Storage:** S3-Integration
- **Build Tool:** Vite

## 📦 Installation

```bash
# Repository klonen
git clone https://github.com/Kevin180791/enterprise-management-platform.git
cd enterprise-management-platform

# Dependencies installieren
pnpm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# .env mit Ihren Werten befüllen

# Datenbank-Schema pushen
pnpm db:push

# Development Server starten
pnpm dev
```

## 🔧 Konfiguration

Erforderliche Umgebungsvariablen:

```env
DATABASE_URL=mysql://...
JWT_SECRET=...
VITE_APP_ID=...
OAUTH_SERVER_URL=...
VITE_OAUTH_PORTAL_URL=...
OPENROUTER_API_KEY=...
```

## 📝 Entwicklungsstatus

### ✅ Implementiert
- Bautagebuch mit Edit/Delete und Foto-Upload
- Zuordnungen-Übersicht mit korrekter Datenanzeige
- Alle Listen zeigen Daten korrekt an
- Backend-API vollständig funktionsfähig

### 🔄 In Arbeit
- Edit/Delete für Begehungen, Mängel, Mitarbeiter, Inventar, Projekte
- Foto-Upload für Begehungen und Mängel
- Mehrere Positionen pro Aufmaß
- Export-Funktionen (PDF/PPTX)

Siehe [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) für detaillierte Implementierungsanleitungen.

## 📚 Dokumentation

- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Schritt-für-Schritt-Anleitungen für verbleibende Features
- [REMAINING_TASKS.md](./REMAINING_TASKS.md) - Übersicht offener Aufgaben
- [OPTIMIZATION_ANALYSIS.md](./OPTIMIZATION_ANALYSIS.md) - Analyse und Optimierungsvorschläge
- [todo.md](./todo.md) - Aktuelle TODO-Liste

## 🏗️ Projektstruktur

```
├── client/               # Frontend React-Anwendung
│   ├── src/
│   │   ├── pages/       # Seiten-Komponenten
│   │   ├── components/  # Wiederverwendbare UI-Komponenten
│   │   └── lib/         # Utilities und tRPC-Client
├── server/              # Backend Express-Server
│   ├── routers.ts       # tRPC-Router-Definitionen
│   ├── db.ts            # Datenbank-Helper
│   └── ai.ts            # KI-Integration (OpenRouter)
├── drizzle/             # Datenbank-Schema und Migrationen
└── shared/              # Geteilte Konstanten und Typen
```

## 🤝 Beitragen

Contributions sind willkommen! Bitte erstellen Sie einen Pull Request oder öffnen Sie ein Issue.

## 📄 Lizenz

Dieses Projekt ist privat und nicht für die öffentliche Nutzung bestimmt.

## 👥 Autoren

- Entwickelt mit Manus AI
- Projekt-Owner: Kevin Schmidt

## 🔗 Links

- [GitHub Repository](https://github.com/Kevin180791/enterprise-management-platform)
- [Manus Platform](https://manus.im)

