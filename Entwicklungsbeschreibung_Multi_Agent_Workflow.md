

# Entwicklungsbeschreibung: Multi-Agent-Workflow für die automatische TGA-Plan- und Dokumentenprüfung

**Autor:** Manus AI
**Datum:** 02.10.2025
**Version:** 1.0

## 1. Einleitung und Zielsetzung

Diese Entwicklungsbeschreibung definiert die Konzeption und Implementierung eines Multi-Agent-Workflows zur automatischen Prüfung von Planungs- und Dokumentationsunterlagen in der Technischen Gebäudeausrüstung (TGA). Das System ist als integraler Bestandteil einer umfassenden TGA-KI-Plattform konzipiert und zielt darauf ab, die Effizienz, Qualität und Normenkonformität in allen Leistungsphasen der HOAI für die Kostengruppe 400 zu steigern. Es analysiert TGA-Pläne aller Gewerke, identifiziert formale, fachliche und koordinative Mängel und stellt die Ergebnisse in strukturierten, nachvollziehbaren Berichten bereit.

## 2. Analyse des bestehenden Systems und des GitHub-Repositorys

Die Analyse des GitHub-Repositorys `Kevin180791/manus` zeigt eine bereits fortgeschrittene TGA-KI-Plattform. Das System verfügt über ein funktionales Frontend, eine robuste Backend-Architektur auf Basis von FastAPI und eine PostgreSQL-Datenbank zur Datenpersistierung. Ein zentraler `TGACoordinator` orchestriert bereits einen Multi-Agent-Workflow, der verschiedene Prüfagenten für spezifische Gewerke und Aufgaben steuert. Die `DEVELOPMENT_PROGRESS_REPORT.md` dokumentiert eine erfolgreiche Implementierung von Datenbankintegration, erweiterter PDF-Analyse und PDF-Berichtsgenerierung. Die `README.md` beschreibt die grundlegende Funktionalität, die API-Endpunkte und den Technologie-Stack. Diese Entwicklungsbeschreibung baut auf dieser soliden Grundlage auf und erweitert das System um eine detaillierte, normenbasierte Prüflogik und eine verfeinerte Multi-Agent-Architektur.

## 3. Fachliche Grundlagen und Normen

Die automatische Prüfung basiert auf einer umfassenden Recherche und Integration relevanter Normen, Richtlinien und technischer Regeln. Die folgende Tabelle gibt einen Überblick über die zentralen Regelwerke, die in die Prüflogik der Agenten implementiert werden.

| Regelwerk | Anwendungsbereich | Relevanz für die automatisierte Prüfung |
| :--- | :--- | :--- |
| **VDI 6026 Blatt 1** | Dokumentation in der TGA | Grundlage für die formale Prüfung auf Vollständigkeit und korrekte Beschaffenheit der Planungsunterlagen in allen Leistungsphasen. |
| **DIN EN 12831-1** | Heizlastberechnung | Validierung der Heizlastberechnungen, Überprüfung der Klimadaten, Gebäudeeinheiten und Lüftungszonen. |
| **ASR A3.6** | Lüftung von Arbeitsstätten | Prüfung der Mindestluftwechselraten und CO2-Grenzwerte in Büroräumen und ähnlichen Arbeitsstätten. |
| **DIN 1946-4** | Raumlufttechnik in Krankenhäusern | Überprüfung der Einhaltung der Raumklassen und der damit verbundenen Anforderungen an die Keimarmut. |
| **TrinkwV & DIN EN 806** | Trinkwasserinstallationen | Sicherstellung der hygienischen Anforderungen, korrekten Materialwahl und Leitungsführung. |
| **GEG / EnEV** | Energieeffizienz von Gebäuden | Prüfung der Einhaltung der energetischen Anforderungen an die TGA-Anlagen. |

## 4. Analyse der TGA-Prüfprozesse und Aufgaben

Die Plan- und Dokumentenprüfung wird in drei aufeinander aufbauende Ebenen unterteilt, die systematisch von den Agenten abgearbeitet werden:

### 4.1. Formale Prüfung
Diese Ebene, verantwortet vom **Formal Compliance Agent**, stellt die grundlegende Konformität der Dokumentation sicher. Aufgaben umfassen:

*   **Vollständigkeitsprüfung:** Abgleich der eingereichten Dokumente mit der Planliste.
*   **Metadaten-Validierung:** Extraktion und Prüfung von Plankopf-Informationen.
*   **Phasenkonformität:** Sicherstellung, dass der Detaillierungsgrad der Unterlagen der jeweiligen HOAI-Leistungsphase entspricht.

### 4.2. Gewerkespezifische Fachprüfung
Spezialisierte **Trade-Specific Expert Agents** prüfen die technischen Inhalte jedes Gewerks auf Basis der relevanten Normen:

*   **KG410 (Sanitär):** Prüfung auf Einhaltung der TrinkwV und DIN EN 806.
*   **KG420 (Heizung):** Validierung der Heizlastberechnung nach DIN EN 12831.
*   **KG430 (Lüftung):** Prüfung der Luftmengen und Konzepte nach ASR A3.6, DIN 1946-4 etc.
*   **Weitere Gewerke (KG440-480):** Prüfung der elektrischen Lasten, Brandschutzkonzepte und Gebäudeautomation.

### 4.3. Gewerkeübergreifende Koordinationsprüfung
Der **Cross-Discipline Coordination Agent** identifiziert Konflikte und Abhängigkeiten zwischen den Gewerken:

*   **Kollisionsprüfung:** Identifikation von geometrischen Konflikten zwischen Trassen und Komponenten.
*   **Schnittstellenanalyse:** Prüfung der logischen Verbindungen (z.B. elektrische Anschlussleistungen, Steuerungssignale).
*   **SuD-Planungs-Validierung:** Abgleich der Schlitz- und Durchbruchsplanung mit der Tragwerksplanung.

## 5. Multi-Agent-Architektur und Microservice-Design

Die Plattform wird als eine Microservice-Architektur realisiert, die über ein Backend-Gateway kommuniziert. Das Herzstück bildet der **TGA-Prüfungs-Service**, der das Multi-Agent-System beherbergt.

### 5.1. Workflow-Diagramm

Das folgende Diagramm visualisiert den gesamten Prüfprozess, vom Dokumenten-Upload bis zur Berichtsgenerierung.

![TGA-Prüfprozess-Workflow](https://private-us-east-1.manuscdn.com/sessionFile/2cWRBVvdw12NuXQskgh8Nc/sandbox/V4TtDRDoUouzURSJNokE1C-images_1759392111007_na1fn_L2hvbWUvdWJ1bnR1L3RnYV93b3JrZmxvd19kaWFncmFt.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMmNXUkJWdmR3MTJOdVhRc2tnaDhOYy9zYW5kYm94L1Y0VHREUkRvVW91elVSU0pOb2tFMUMtaW1hZ2VzXzE3NTkzOTIxMTEwMDdfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwzUm5ZVjkzYjNKclpteHZkMTlrYVdGbmNtRnQucG5nIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Vofaj4sknPV4vYt9NUoQS8-5Uz6-NiYeZnuxM2S03KeRZqmVFhILGT3FSxxsR8HWl~zx8aTocOYGYdfvkxHIDwmRCVV1OGVLbxIprI73QF6PKodyyCaONYibJUKWvLJmIEpS-vfiF~FpE9yhWfIx8sQb9rl3PLyNKBVQSpxa4IbokS6IfWsryKM66Vwucf00gQv~kHFh7zoGpK8PdKzY9S8HdroIXYd9kDZ614s4Ox4Wemr4lcF1rj98e2Sfoz8uMckyNVV03uqBkIeClSfnXx3wyZCTv2ek-gDEfvqnVwIewaXmkb7BfPDoBxynSLXoXf9icS6Ru33gKSXtuWX04Q__)

### 5.2. Agenten-Design und Kommunikation

Jeder Agent ist als autonomer Prozess oder Microservice konzipiert. Die Kommunikation und Aufgabenverteilung zwischen dem **TGA Coordinator Agent** und den spezialisierten Agenten erfolgt asynchron über eine Message Queue (z.B. RabbitMQ). Dies gewährleistet eine hohe Skalierbarkeit und Robustheit des Systems.

### 5.3. Technologie-Stack

| Komponente | Technologie | Begründung |
| :--- | :--- | :--- |
| **Backend** | Python, FastAPI | Hohe Performance, asynchrone Verarbeitung, einfache API-Erstellung. |
| **Frontend** | React, TypeScript | Moderne, komponentenbasierte UI-Entwicklung mit Typsicherheit. |
| **Datenbank** | PostgreSQL | Robust, skalierbar, unterstützt komplexe Abfragen und JSON-Daten. |
| **Message Queue** | RabbitMQ | Zuverlässige, asynchrone Kommunikation zwischen den Agenten. |
| **Containerisierung**| Docker, Docker Compose | Konsistente Entwicklungs- und Produktionsumgebungen. |

## 6. Prüfkriterien und Ergebnisbewertung

Um die Relevanz und Nachvollziehbarkeit der Prüfergebnisse zu gewährleisten, werden die Befunde nach einem klaren System bewertet.

*   **Prioritätssystem:** Befunde werden in "Hoch", "Mittel" und "Niedrig" klassifiziert, basierend auf ihrer Auswirkung auf Sicherheit, Funktion und Normenkonformität.
*   **Konfidenz-Scoring:** Jeder automatisch generierte Befund erhält einen Konfidenz-Score, der die Zuverlässigkeit der Erkennung angibt. Ergebnisse mit niedrigem Score werden zur manuellen Verifikation markiert, um Halluzinationen zu vermeiden.

## 7. Implementierung und nächste Schritte

Die Implementierung erfolgt auf Basis des bestehenden Codes im GitHub-Repository. Die nächsten Schritte umfassen:

1.  **Verfeinerung der Agenten-Logik:** Detaillierte Ausprogrammierung der Prüfregeln für jeden Agenten basierend auf den recherchierten Normen.
2.  **OCR-Integration:** Implementierung eines OCR-Services (z.B. Tesseract) im **Document Intake Agent** zur Extraktion von Text aus gescannten Plänen und Planköpfen.
3.  **UI/UX-Verbesserungen:** Optimierung der Ergebnisvisualisierung im Frontend zur besseren Darstellung der Befunde und ihrer Verortung im Plan.
4.  **Test-Automatisierung:** Erweiterung der Unit- und Integrationstests zur Absicherung der komplexen Prüflogik.

## 8. Zusammenfassung und Ausblick

Diese Entwicklungsbeschreibung skizziert einen robusten und skalierbaren Multi-Agent-Workflow für die automatisierte TGA-Planprüfung. Durch die Kombination einer Microservice-Architektur mit spezialisierten, KI-gestützten Agenten wird eine tiefgreifende und normenkonforme Prüfung über alle Gewerke und Leistungsphasen hinweg ermöglicht. Das System ist darauf ausgelegt, Halluzinationen durch ein mehrstufiges Validierungssystem zu minimieren und Planern, Architekten und Bauherren ein leistungsstarkes Werkzeug zur Qualitätssicherung an die Hand zu geben. Zukünftige Erweiterungen könnten die Integration von BIM-Modellen (IFC) und die Nutzung von Machine Learning zur kontinuierlichen Verbesserung der Prüfalgorithmen umfassen.

## 9. Referenzen

*   [VDI 6026 Blatt 1: Dokumentation in der technischen Gebäudeausrüstung](https://www.vdi.de/richtlinien/details/vdi-6026-blatt-1-dokumentation-in-der-technischen-gebaeudeausruestung-tga-inhalte-und-beschaffenheit-von-planungs-ausfuehrungs-und-revisionsunterlagen)
*   [DIN EN 12831: Energetische Bewertung von Gebäuden - Verfahren zur Berechnung der Norm-Heizlast](https://www.din.de/de/mitwirken/normenausschuesse/nhrs/veroeffentlichungen/wdc-beuth:din21:323855309)
*   [ASR A3.6: Technische Regeln für Arbeitsstätten - Lüftung](https://www.baua.de/DE/Angebote/Regelwerk/ASR/ASR-A3-6.html)
*   [DIN 1946-4: Raumlufttechnik - Teil 4: Raumlufttechnische Anlagen in Gebäuden und Räumen des Gesundheitswesens](https://www.din.de/de/mitwirken/normenausschuesse/nhrs/veroeffentlichungen/wdc-beuth:din21:298536335)
*   [Trinkwasserverordnung (TrinkwV)](https://www.gesetze-im-internet.de/trinkwv_2023/)
*   [Gebäudeenergiegesetz (GEG)](https://www.gesetze-im-internet.de/geg/)

