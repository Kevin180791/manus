# Verbleibende Aufgaben

## Priorität 1 - Benutzerfreundlichkeit

### 1. Edit/Delete für alle Listen
- [x] DailyReports (Bautagebuch) - FERTIG
- [ ] InspectionProtocols (Begehungen)
- [ ] DefectProtocols (Mängel)
- [ ] Employees (Mitarbeiter)
- [ ] Inventory (Inventar)
- [ ] Projects (Projekte)

**Implementierungsmuster** (siehe DailyReports.tsx):
1. Pencil, Trash2 Icons importieren
2. editingItem State hinzufügen
3. updateMutation und deleteMutation erstellen
4. handleEdit und handleDelete Funktionen
5. Buttons in Card Header einfügen

### 2. Foto-Upload für Dokumentationen
- [x] DailyReports (Bautagebuch) - FERTIG
- [ ] InspectionProtocols (Begehungen)
- [ ] DefectProtocols (Mängel)

**Implementierungsmuster** (siehe DailyReports.tsx):
1. PhotoUpload-Komponente importieren
2. photos State hinzufügen
3. PhotoUpload in Dialog einfügen
4. photos zu handleSubmit hinzufügen (JSON.stringify)
5. photos beim Bearbeiten laden (JSON.parse)
6. photos zurücksetzen in Mutations

### 3. Zuordnungen-Seite
- Status: Backend funktioniert, 4 Zuordnungen in DB
- Problem: Möglicherweise UI-Darstellung oder Filterlogik
- Lösung: Console-Logs hinzufügen um zu sehen welche Daten ankommen

## Priorität 2 - Erweiterte Features

### 4. Aufmaß: Mehrere Positionen
Aktuell: Ein Aufmaß = Eine Position
Ziel: Ein Aufmaß = Mehrere Positionen

**Implementierung**:
1. Neue Tabelle `measurementItems` erstellen:
   - id, measurementId, description, quantity, unit, length, width, height, unitPrice, totalPrice
2. measurements-Router erweitern um Items
3. Measurements-Seite mit Items-Tabelle pro Aufmaß
4. Summenberechnung über alle Items

### 5. Export-Funktionen aktivieren
- PDF-Export für Bautagebuch
- PDF-Export für Mängelprotokoll  
- PowerPoint-Export für Begehungen

**Status**: Helper-Funktionen existieren in server/pdfExport.ts und server/pptxExport.ts
**TODO**: Router-Endpunkte aktivieren und Export-Buttons in UI hinzufügen

## Priorität 3 - Optimierungen

### 6. KI-Features testen
- Berichtsgenerierung
- Mangelanalyse
- Prioritätsvorschläge
- Projektzusammenfassungen

### 7. GitHub-Synchronisation
- Automatisches Pushen bei Checkpoints
- SSH-Key konfigurieren oder Personal Access Token verwenden

## Hinweise

- Alle Backend-Router haben bereits update/delete Endpunkte
- Alle Dokumentations-Schemas haben photos-Felder
- PhotoUpload-Komponente ist fertig und funktioniert
- Das Implementierungsmuster ist bei allen Listen identisch

