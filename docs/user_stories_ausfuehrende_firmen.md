# User Stories: Ausführende Firmen

**Zielgruppe**: Bauleiter, Obermonteure, Arbeitsvorbereitung (AVOR) von TGA-Ausführungsfirmen

## Epic 1: Ausführungsreife prüfen

### US-EX-01: Schnelle Ausführbarkeits-Prüfung
**Als** Bauleiter einer ausführenden Firma  
**möchte ich** innerhalb von 5 Minuten feststellen können, ob die Planungsunterlagen ausführungsreif sind  
**damit** ich entscheiden kann, ob wir mit der Arbeitsvorbereitung beginnen können oder noch Klärungsbedarf besteht.

**Akzeptanzkriterien**:
- Upload von Planungsunterlagen (ZIP mit allen Plänen)
- Automatische Prüfung auf Ausführungsreife
- Ampel-System: Grün (ausführungsreif), Gelb (Klärungsbedarf), Rot (nicht ausführungsreif)
- Liste der fehlenden oder unvollständigen Unterlagen
- Liste der kritischen Befunde, die vor Baustellenstart geklärt werden müssen

**Priorität**: Must-Have  
**Aufwand**: M (3-5 Tage)

---

### US-EX-02: Detailgrad-Prüfung für LP5
**Als** Obermonteur  
**möchte ich** wissen, ob alle erforderlichen Detailzeichnungen für die Ausführung vorhanden sind  
**damit** ich nicht auf der Baustelle vor unlösbaren Problemen stehe.

**Akzeptanzkriterien**:
- Prüfung auf Vorhandensein von Detailzeichnungen (Anschlussdetails, Befestigungen, etc.)
- Prüfung auf ausreichenden Detailgrad (Maßstab, Bemaßung)
- Liste fehlender Detailzeichnungen mit Priorität
- Vorschläge, welche Details noch geklärt werden müssen

**Priorität**: Must-Have  
**Aufwand**: M (3-5 Tage)

---

### US-EX-03: Materialspezifikations-Prüfung
**Als** AVOR-Mitarbeiter  
**möchte ich** wissen, ob alle Materialien eindeutig spezifiziert sind  
**damit** ich die richtigen Materialien bestellen kann und keine Rückfragen stellen muss.

**Akzeptanzkriterien**:
- Extraktion aller Materialspezifikationen aus Plänen und LV
- Prüfung auf Eindeutigkeit (Hersteller, Typ, Abmessungen)
- Liste unvollständiger oder widersprüchlicher Spezifikationen
- Automatische Zuordnung zu Standardprodukten (wenn möglich)

**Priorität**: Should-Have  
**Aufwand**: L (5-10 Tage)

---

## Epic 2: Arbeitsvorbereitung (AVOR) unterstützen

### US-EX-04: Automatische Materialliste
**Als** AVOR-Mitarbeiter  
**möchte ich** eine automatisch generierte Materialliste aus den Plänen erhalten  
**damit** ich nicht manuell alle Pläne durchgehen und Materialien zählen muss.

**Akzeptanzkriterien**:
- Extraktion aller Materialien aus Plänen (Heizkörper, Leitungen, Armaturen, etc.)
- Gruppierung nach Gewerk und Materialtyp
- Mengenangaben (Stück, Meter, m²)
- Export als CSV/Excel für ERP-Import
- Abgleich mit Leistungsverzeichnis (optional)

**Priorität**: Must-Have  
**Aufwand**: XL (10-15 Tage)

---

### US-EX-05: Mengenermittlung aus Plänen
**Als** AVOR-Mitarbeiter  
**möchte ich** die Mengen aus den Plänen automatisch berechnet bekommen  
**damit** ich eine präzise Kalkulation erstellen kann.

**Akzeptanzkriterien**:
- Automatische Berechnung von Leitungslängen aus Plänen
- Berechnung von Flächen (z.B. für Dämmung)
- Zählung von Komponenten (Heizkörper, Auslässe, etc.)
- Plausibilitätsprüfung gegen Leistungsverzeichnis
- Exportfunktion

**Priorität**: Should-Have  
**Aufwand**: XL (15-20 Tage)

---

### US-EX-06: Schnittstellen zu anderen Gewerken identifizieren
**Als** Bauleiter  
**möchte ich** wissen, welche Schnittstellen mein Gewerk zu anderen Gewerken hat  
**damit** ich die Koordination mit anderen Firmen planen kann.

**Akzeptanzkriterien**:
- Automatische Identifikation von Schnittstellen (z.B. Elektro-Anschlüsse für Heizung)
- Liste aller Schnittstellen mit Beschreibung
- Zuordnung zu verantwortlichen Gewerken
- Prüfung, ob Schnittstellen in SuD-Plänen berücksichtigt sind

**Priorität**: Should-Have  
**Aufwand**: L (5-10 Tage)

---

## Epic 3: Änderungsmanagement

### US-EX-07: Planänderungen erkennen
**Als** Bauleiter  
**möchte ich** automatisch benachrichtigt werden, wenn sich Pläne geändert haben  
**damit** ich rechtzeitig reagieren und meine Planung anpassen kann.

**Akzeptanzkriterien**:
- Upload neuer Planrevision
- Automatischer Vergleich mit vorheriger Revision
- Visuelle Darstellung der Änderungen (Diff-Ansicht)
- Liste aller Änderungen mit Beschreibung
- Benachrichtigung per E-Mail (optional)

**Priorität**: Should-Have  
**Aufwand**: XL (10-15 Tage)

---

### US-EX-08: Auswirkungsanalyse von Planänderungen
**Als** Bauleiter  
**möchte ich** wissen, wie sich Planänderungen auf meine Kalkulation und meinen Zeitplan auswirken  
**damit** ich fundierte Entscheidungen über Nachträge treffen kann.

**Akzeptanzkriterien**:
- Analyse, welche Gewerke von Änderungen betroffen sind
- Abschätzung der Auswirkungen auf Materialmengen
- Abschätzung der Auswirkungen auf Arbeitszeit
- Vorschlag für Nachtragskalkulation
- Dokumentation für Nachtragsverhandlung

**Priorität**: Could-Have  
**Aufwand**: XL (15-20 Tage)

---

### US-EX-09: Nachtragsdokumentation
**Als** Bauleiter  
**möchte ich** alle Planänderungen und deren Auswirkungen strukturiert dokumentieren  
**damit** ich bei Nachtragsverhandlungen alle Informationen zur Hand habe.

**Akzeptanzkriterien**:
- Erfassung aller Planänderungen
- Zuordnung zu Nachträgen
- Dokumentation der Mehrkosten
- Export als PDF-Bericht für Auftraggeber
- Historische Übersicht aller Nachträge

**Priorität**: Could-Have  
**Aufwand**: M (3-5 Tage)

---

## Epic 4: Baustellenunterstützung

### US-EX-10: Mobile Zugriff auf Pläne
**Als** Obermonteur auf der Baustelle  
**möchte ich** auf meinem Tablet Zugriff auf alle Pläne und Befunde haben  
**damit** ich vor Ort schnell nachschlagen kann, ohne ins Büro zu müssen.

**Akzeptanzkriterien**:
- Responsive Web-App für Tablets
- Offline-Verfügbarkeit der Pläne
- Suchfunktion nach Raum, Gewerk, Komponente
- Zoom- und Navigationsfunktionen
- Synchronisation bei Internetverbindung

**Priorität**: Could-Have  
**Aufwand**: L (5-10 Tage)

---

### US-EX-11: Abweichungsdokumentation
**Als** Obermonteur  
**möchte ich** Abweichungen von der Planung direkt auf der Baustelle fotografieren und dokumentieren  
**damit** diese später bei der Abnahme nachvollziehbar sind.

**Akzeptanzkriterien**:
- Fotofunktion in der App
- Zuordnung zu Plan und Position
- Beschreibung der Abweichung
- Automatische Geo-Tagging (optional)
- Export für Abnahmeprotokoll

**Priorität**: Won't-Have (für MVP)  
**Aufwand**: M (3-5 Tage)

---

## Epic 5: Reporting und Kommunikation

### US-EX-12: Ausführungs-Dashboard
**Als** Bauleiter  
**möchte ich** einen Überblick über alle meine Projekte und deren Ausführungsreife haben  
**damit** ich Prioritäten setzen und Ressourcen optimal verteilen kann.

**Akzeptanzkriterien**:
- Dashboard mit allen Projekten
- Status-Anzeige pro Projekt (ausführungsreif, Klärungsbedarf, blockiert)
- Anzahl offener Punkte pro Projekt
- Zeitstempel der letzten Aktualisierung
- Filterfunktion nach Status, Gewerk, Datum

**Priorität**: Should-Have  
**Aufwand**: M (3-5 Tage)

---

### US-EX-13: Strukturierter Prüfbericht für Auftraggeber
**Als** Bauleiter  
**möchte ich** einen strukturierten Prüfbericht generieren können  
**damit** ich dem Planungsbüro oder Auftraggeber klar kommunizieren kann, was noch fehlt oder geklärt werden muss.

**Akzeptanzkriterien**:
- PDF-Bericht mit allen Befunden
- Gruppierung nach Priorität und Gewerk
- Planverweise und Visualisierungen
- Zusammenfassung und Empfehlungen
- Professionelles Layout

**Priorität**: Should-Have  
**Aufwand**: M (3-5 Tage)

---

## Priorisierung für MVP (Ausführende Firmen)

### Must-Have (Phase 1 - 4 Wochen)
1. **US-EX-01**: Schnelle Ausführbarkeits-Prüfung
2. **US-EX-02**: Detailgrad-Prüfung für LP5
3. **US-EX-04**: Automatische Materialliste
4. **US-EX-12**: Ausführungs-Dashboard

**Gesamtaufwand**: ~15-20 Tage Entwicklung

### Should-Have (Phase 2 - 6 Wochen)
1. **US-EX-03**: Materialspezifikations-Prüfung
2. **US-EX-05**: Mengenermittlung aus Plänen
3. **US-EX-06**: Schnittstellen identifizieren
4. **US-EX-07**: Planänderungen erkennen
5. **US-EX-13**: Strukturierter Prüfbericht

**Gesamtaufwand**: ~35-50 Tage Entwicklung

### Could-Have (Phase 3 - später)
1. **US-EX-08**: Auswirkungsanalyse
2. **US-EX-09**: Nachtragsdokumentation
3. **US-EX-10**: Mobile Zugriff

### Won't-Have (für MVP)
1. **US-EX-11**: Abweichungsdokumentation

## Technische Abhängigkeiten

| User Story | Abhängigkeiten | Technologie |
|------------|----------------|-------------|
| US-EX-01 | Bestehende Checks erweitern | Python, Regelbasiert |
| US-EX-02 | PDF-Parsing, OCR | pdfplumber, Tesseract |
| US-EX-03 | LLM für Spezifikations-Extraktion | OpenAI API |
| US-EX-04 | Computer Vision, OCR | OpenCV, Tesseract |
| US-EX-05 | Computer Vision, Geometrie-Analyse | OpenCV, shapely |
| US-EX-06 | Regelbasierte Analyse | Python |
| US-EX-07 | Computer Vision, Diff-Algorithmus | OpenCV, diff-match-patch |
| US-EX-08 | LLM für Auswirkungsanalyse | OpenAI API |
| US-EX-09 | Datenmodell-Erweiterung | SQLAlchemy |
| US-EX-10 | PWA, Service Worker | React, Workbox |
| US-EX-11 | Kamera-API | React, MediaDevices API |
| US-EX-12 | Frontend-Entwicklung | React |
| US-EX-13 | PDF-Generierung | ReportLab, WeasyPrint |

## Erfolgskriterien

**Wie messen wir Erfolg?**

1. **Zeitersparnis**
   - Ausführbarkeits-Prüfung: Von 2-3 Stunden auf < 5 Minuten
   - Materiallisten-Erstellung: Von 4-8 Stunden auf < 30 Minuten

2. **Fehlerreduktion**
   - 80% weniger fehlende Materialien auf der Baustelle
   - 50% weniger Rückfragen an Planungsbüro

3. **Kundenzufriedenheit**
   - NPS > 40 bei ausführenden Firmen
   - 3-5 Pilotfirmen nutzen die Plattform aktiv

4. **Technische Qualität**
   - 90%+ Genauigkeit bei Materiallisten-Extraktion
   - < 2 Sekunden Response-Zeit für Ausführbarkeits-Check

