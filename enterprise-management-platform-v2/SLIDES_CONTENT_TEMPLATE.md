# Begehungs- und Übergabedokumentation
## {{PROJECT_NAME}}

---

## Slide 1: Titelfolie
**Layout:** Gradient-Hintergrund (Blau #1E3A8A → #3B82F6)

### Hauptüberschrift
Begehungs- und Übergabedokumentation

### Untertitel
{{PROJECT_NAME}}

### Metadaten-Boxen (mit Rahmen)
- **Datum der Begehung:** {{DATE}}
- **Zeitraum der Ausführung:** {{TIMEFRAME}}
- **Ersteller:** {{INSPECTOR}}

---

## Slide 2: Projektübersicht und Zielsetzung
**Layout:** Zweispaltig - Text links, Statistik-Karten rechts  
**Farbe:** Türkis (#0891B2)

### Überschrift
Projektübersicht und Zielsetzung

### Beschreibung (links)
{{OVERVIEW_TEXT}}

Die Baustellenbegehung dokumentiert den aktuellen Stand der TGA-Arbeiten im 3. Obergeschoss des Sozialtrakts bei Edeka. Im Fokus stehen kritische Feststellungen zu Leitungsverläufen, Brandschutzanforderungen und notwendigen Rückbaumaßnahmen. Die Dokumentation dient der strukturierten Übergabe an das Planungsbüro zur weiteren Abstimmung und Freigabe erforderlicher Maßnahmen.

### Statistik-Karten (rechts, 2x2 Grid)
1. **Hauptfeststellungen** 📋  
   Anzahl: {{FINDINGS_COUNT}}

2. **Fotodokumentationen** 📷  
   Anzahl: {{PHOTOS_COUNT}}

3. **Grundriss-Skizze** 🗺️  
   Anzahl: 1

4. **Fristen** ✅  
   KW 43-45

---

## Slide 3: Grundrissplan (Optional)
**Layout:** Zentriertes Bild  
**Farbe:** Pink (#EC4899)

### Überschrift
Grundriss 3.OG Edeka Plan

### Bild
{{FLOOR_PLAN_IMAGE}}

### Bildunterschrift
Grundrissplan mit markierten Feststellungsbereichen

---

## Slide 4-N: Befund-Folien
**Layout:** Zweispaltig - Text links, Foto rechts  
**Farben:** Abwechselnd Pink, Lila, Orange, Grün

### Slide-Struktur (für jeden Befund)

#### Nummerierung
FESTSTELLUNG {{NUMBER}}.1

#### Hauptüberschrift
{{FINDING_TITLE}}

#### Feststellung (links oben)
**FESTSTELLUNG**  
{{FINDING_DESCRIPTION}}

Der Verlauf der WF-Rohre im Lüftungsschacht ist nicht eindeutig nachvollziehbar. Die massive Schachtwand muss für den Anschluss an die Bestandslüftung geöffnet werden, was eine statische Bewertung erfordert.

#### Empfohlene Maßnahme (links unten)
**EMPFOHLENE MASSNAHME**  
{{RECOMMENDED_ACTION}}

Klärung durch Planungsbüro mit Anpassung der Ausführungsplanung und statischer Freigabe

#### Info-Boxen (links unten)
- **Verantwortlich:** Planungsbüro
- **Frist:** KW 43

#### Fotodokumentation (rechts)
**FOTODOKUMENTATION**

Bild: {{PHOTO_URL}}

Bildunterschrift: Foto {{NUMBER}}: {{PHOTO_CAPTION}}

---

## Slide-Farben-Zuordnung
- Slide 1 (Titel): Blau (#1E3A8A)
- Slide 2 (Übersicht): Türkis (#0891B2)
- Slide 3 (Grundriss): Pink (#EC4899)
- Slide 4 (Befund 1): Lila (#8B5CF6)
- Slide 5 (Befund 2): Orange (#F97316)
- Slide 6 (Befund 3): Grün (#10B981)
- Weitere Befunde: Farben wiederholen

---

## Design-Richtlinien

### Typografie
- **Hauptüberschriften:** 48px, Bold, Weiß (auf dunklem Hintergrund)
- **Unterüberschriften:** 32px, Semi-Bold
- **Fließtext:** 18px, Regular
- **Metadaten:** 16px, Medium

### Spacing
- **Slide-Padding:** 60px
- **Element-Abstände:** 24px
- **Box-Padding:** 20px

### Boxen & Rahmen
- **Rahmen:** 2px solid, Farbe passend zum Slide
- **Border-Radius:** 8px
- **Schatten:** Subtil, 0 4px 6px rgba(0,0,0,0.1)

### Bilder
- **Maximale Breite:** 50% (bei zweispaltigem Layout)
- **Border-Radius:** 8px
- **Schatten:** 0 4px 12px rgba(0,0,0,0.15)

---

## Variablen-Mapping

### Projekt-Daten
- `{{PROJECT_NAME}}`: Name des Projekts
- `{{DATE}}`: Datum der Begehung
- `{{TIMEFRAME}}`: Zeitraum der Ausführung
- `{{INSPECTOR}}`: Ersteller/Inspektor

### Statistiken
- `{{FINDINGS_COUNT}}`: Anzahl der Feststellungen
- `{{PHOTOS_COUNT}}`: Anzahl der Fotos
- `{{OVERVIEW_TEXT}}`: KI-generierte Übersicht

### Befund-Daten (für jede Befund-Folie)
- `{{NUMBER}}`: Befund-Nummer (1, 2, 3, ...)
- `{{FINDING_TITLE}}`: Titel des Befunds
- `{{FINDING_DESCRIPTION}}`: Detaillierte Beschreibung
- `{{RECOMMENDED_ACTION}}`: Empfohlene Maßnahme
- `{{PHOTO_URL}}`: URL des Fotos
- `{{PHOTO_CAPTION}}`: Bildunterschrift

---

## KI-Generierungs-Prompts

### Übersichtstext
```
Erstelle eine professionelle Projektübersicht für eine Begehungsdokumentation.
Projekt: {{PROJECT_NAME}}
Befunde: {{FINDINGS_LIST}}

Schreibe einen prägnanten Absatz (max. 100 Wörter), der den aktuellen Stand,
die Hauptfokuspunkte und den Zweck der Dokumentation erklärt.
```

### Befund-Beschreibung
```
Verbessere die folgende technische Beschreibung:
Titel: {{FINDING_TITLE}}
Beschreibung: {{FINDING_DESCRIPTION}}

Schreibe eine präzise, professionelle Beschreibung (max. 80 Wörter) mit
technisch korrekter Fachsprache ohne Füllwörter.
```

### Handlungsempfehlung
```
Generiere eine konkrete Handlungsempfehlung:
Titel: {{FINDING_TITLE}}
Beschreibung: {{FINDING_DESCRIPTION}}

Schreibe eine präzise Handlungsempfehlung (max. 50 Wörter) mit konkreten
Schritten und klaren Verantwortlichkeiten.
```

