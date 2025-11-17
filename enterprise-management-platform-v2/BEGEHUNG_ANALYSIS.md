# Analyse: Begehungsdokumentation

## Beispiel-Struktur (PPTX)
- **10 Slides** mit **27 Bildern**
- Format: PowerPoint-Präsentation
- Typische Struktur für Begehungsprotokolle

## Zu implementierende Features

### 1. Detailseiten für Einträge
- **Bautagebuch-Eintrag**: Einzelansicht mit allen Details, Fotos, Teilnehmern
- **Begehungsprotokoll**: Detailansicht mit Raum/Bereich, Fotos, Feststellungen
- **Mängelprotokoll**: Einzelmangel mit Fotos, Status, Verantwortlichkeiten

### 2. Foto-Upload und -Verwaltung
- Multi-File-Upload für Fotos
- Zuordnung zu spezifischen Einträgen/Räumen
- Thumbnail-Vorschau und Vollbildansicht
- S3-Storage-Integration

### 3. Intelligente Export-Funktionen

#### Bautagebuch
- **Einzelbericht**: PDF-Export eines Tagesberichts
- **Zeitraumbericht**: Von-Bis-Bericht mit Zusammenfassung
- KI-generierte Zusammenfassung der Tätigkeiten

#### Begehungsprotokoll  
- **PowerPoint-Export**: Ähnlich dem Beispiel
  * Titelfolie mit Projektinfo
  * Pro Raum/Bereich: Fotos mit Beschreibungen
  * Zusammenfassung der Feststellungen
- KI-gestützte Kategorisierung der Feststellungen

#### Mängelprotokoll
- **Gefilterte Berichte**: Nach Status, Priorität, Gewerk
- **PDF-Export**: Tabellarisch mit Fotos
- KI-Analyse für Muster und Empfehlungen

### 4. Technische Umsetzung
- **Storage**: S3 für Fotos (bereits konfiguriert)
- **PDF-Generation**: Server-seitig mit PDFKit oder ähnlich
- **PPTX-Generation**: pptxgenjs oder officegen
- **KI-Integration**: OpenRouter (bereits konfiguriert) + Manus API

## Nächste Schritte
1. Backend erweitern: Foto-Upload-Endpunkte
2. Detailseiten erstellen
3. Export-Funktionen implementieren
4. KI-Features integrieren

