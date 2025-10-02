# Analyse der TGA-Prüfprozesse und Aufgaben

## Überblick der Prüfebenen

Die automatische Plan- und Dokumentenprüfung für TGA-Projekte der Kostengruppe 400 erfordert eine strukturierte Herangehensweise auf mehreren Ebenen. Basierend auf der Analyse des bestehenden Systems und den recherchierten Normen lassen sich die Prüfprozesse in drei Hauptkategorien unterteilen.

### Formale Prüfung nach VDI 6026

Die formale Prüfung bildet das Fundament der Dokumentenvalidierung und orientiert sich an den Anforderungen der VDI 6026 Blatt 1. Diese Prüfebene stellt sicher, dass alle erforderlichen Unterlagen vollständig und in der korrekten Form vorliegen.

**Vollständigkeitsprüfung der Dokumentation**: Die Prüfung beginnt mit dem Abgleich der eingereichten Dokumente gegen die Planliste. Dabei werden sowohl Dateinamen als auch Dokumentinhalte systematisch überprüft. Besondere Aufmerksamkeit gilt den Planköpfen, die typischerweise unten rechts positioniert sind, sowie den Deckblättern der Dokumente. Der Vergleich erfolgt schrittweise und strukturiert, um die Vollständigkeit zu gewährleisten.

**Phasenspezifische Dokumentationsanforderungen**: Je nach Leistungsphase (LP1 bis LP9) variieren die Anforderungen an Umfang und Detaillierungsgrad der Dokumentation. Die VDI 6026 definiert gewerkebezogene Dokumentationstabellen, die als Prüfgrundlage dienen. Für die Entwurfsplanung (LP3) sind andere Unterlagen erforderlich als für die Ausführungsplanung (LP5).

**Metadatenextraktion und -validierung**: Aus Planköpfen und Deckblättern werden systematisch Metadaten extrahiert, einschließlich Plannummer, Revision, Maßstab, Ersteller und Prüfvermerk. Diese Informationen werden auf Konsistenz und Vollständigkeit geprüft.

### Gewerkespezifische Fachprüfung

Die fachliche Prüfung erfolgt parallel für alle Gewerke der KG400 und berücksichtigt die spezifischen technischen Anforderungen und Normen jedes Gewerks.

**KG410 Sanitär, Abwasser, Wasser, Gas**: Die Prüfung konzentriert sich auf die Einhaltung der Trinkwasserverordnung (TrinkwV) und der DIN EN 806-Normenreihe. Besondere Aufmerksamkeit gilt der Materialwahl, Leitungsführung und den hygienischen Anforderungen. Water Safety Plan (WSP) Konzepte werden auf Vollständigkeit und Umsetzbarkeit geprüft.

**KG420 Wärmeversorgungsanlagen**: Die Heizlastberechnung nach DIN EN 12831-1 steht im Mittelpunkt der Prüfung. Das System validiert die verwendeten Klimadaten, prüft die Gebäudeeinheiten und Lüftungszonen-Konzepte und bewertet die Plausibilität der berechneten Heizlasten. Die Dimensionierung von Wärmeabgabe-, Erzeuger- und Verteilsystemen wird auf technische Korrektheit überprüft.

**KG430 Raumlufttechnische Anlagen**: Die Prüfung erfolgt gebäudetypspezifisch nach verschiedenen Normen. Für Bürogebäude gelten die Anforderungen der ASR A3.6 mit Mindestluftwechselraten und CO2-Grenzwerten. Krankenhäuser unterliegen der DIN 1946-4 mit spezifischen Raumklassen und Keimarmut-Anforderungen. Küchen werden nach VDI 2052 geprüft.

**KG440/KG450 Elektrotechnik und Kommunikation**: Die elektrische Anschlussleistung wird mit anderen Gewerken abgestimmt, insbesondere bei Wärmepumpen und RLT-Anlagen. Lastberechnungen und Schnittstellen zu anderen Gewerken stehen im Fokus.

**KG474 Feuerlöschanlagen**: Brandschutzkonzepte werden auf Vollständigkeit und Koordination mit anderen Gewerken geprüft. Besondere Aufmerksamkeit gilt den Schnittstellen zur Gebäudeautomation.

**KG480 Gebäudeautomation**: Die Integration verschiedener Gewerke über Gebäudeautomationssysteme wird auf Konsistenz und Funktionalität geprüft.

### Gewerkeübergreifende Koordinationsprüfung

Die Koordinationsprüfung identifiziert und bewertet Schnittstellen zwischen den verschiedenen Gewerken sowie potenzielle Konflikte.

**Kollisionsprüfung**: Geometrische Kollisionen zwischen verschiedenen Gewerken werden identifiziert, insbesondere bei Leitungsführungen und Geräteaufstellungen. Höhenkoordinationen zwischen Lüftungskanälen, Elektrotrassen und anderen Installationen werden systematisch geprüft.

**Schnittstellenanalyse**: Die Abstimmung zwischen Gewerken wird auf verschiedenen Ebenen validiert. Elektrische Anschlussleistungen müssen zwischen Heizung und Elektro abgestimmt sein. Steuerungsschnittstellen zur Gebäudeautomation werden auf Vollständigkeit geprüft.

**Schlitz- und Durchbruchsplanung (SuD)**: Die SuD-Planung wird auf Vollständigkeit und Abstimmung mit der Tragwerksplanung geprüft. Alle erforderlichen Durchbrüche für TGA-Installationen müssen dokumentiert und freigegeben sein.

## Prüfkriterien und Bewertungsmaßstäbe

### Prioritätssystem für Befunde

Die identifizierten Befunde werden nach einem dreistufigen Prioritätssystem klassifiziert, das sowohl technische als auch rechtliche Aspekte berücksichtigt.

**Hohe Priorität**: Befunde mit hoher Priorität betreffen sicherheitsrelevante Aspekte, rechtliche Anforderungen oder grundlegende Funktionsfähigkeit. Dazu gehören Verstöße gegen die Trinkwasserverordnung, unzureichende Brandschutzmaßnahmen oder fehlende Heizlastberechnungen.

**Mittlere Priorität**: Diese Kategorie umfasst technische Mängel, die die Funktionsfähigkeit beeinträchtigen können, aber nicht unmittelbar sicherheitsrelevant sind. Beispiele sind unvollständige Legenden, fehlende Beschriftungen oder Abweichungen von Normen ohne Sicherheitsbezug.

**Niedrige Priorität**: Befunde niedriger Priorität betreffen hauptsächlich Optimierungspotenziale oder formale Aspekte ohne direkten Einfluss auf Funktion oder Sicherheit.

### Konfidenz-Scoring

Jeder Befund wird mit einem Konfidenz-Score zwischen 0,0 und 1,0 bewertet, der die Zuverlässigkeit der automatischen Erkennung widerspiegelt. Hohe Konfidenz-Scores (>0,9) werden bei eindeutigen Regelverstößen vergeben, während niedrigere Scores (<0,7) auf Bereiche hinweisen, die eine manuelle Nachprüfung erfordern.

## Automatisierungsansätze

### PDF-Analyse und Texterkennung

Das bestehende System nutzt bereits erweiterte PDF-Analyseverfahren mit drei verschiedenen Erkennungsstrategien. Die linienbasierte Tabellenerkennung identifiziert strukturierte Daten, während textbasierte Strukturerkennung und TGA-spezifische Regex-Pattern relevante Informationen extrahieren.

### Plausibilitätsprüfungen

Automatisierte Plausibilitätsprüfungen validieren technische Berechnungen und Dimensionierungen. Heizlasten werden gegen Gebäudeparameter geprüft, Luftmengen gegen Raumgrößen und Nutzungsarten validiert.

### Schnittstellen-Mapping

Ein systematisches Mapping der Schnittstellen zwischen Gewerken ermöglicht die automatische Identifikation von Koordinationsproblemen. Elektrische Lasten werden mit Anschlussleistungen abgeglichen, Steuerungssignale auf Konsistenz geprüft.

## Herausforderungen und Lösungsansätze

### Halluzinationsvermeidung

Die Vermeidung von Halluzinationen in KI-basierten Systemen erfordert mehrschichtige Validierungsansätze. Regelbasierte Prüfungen bilden das Fundament, ergänzt durch Konfidenz-Bewertungen und manuelle Nachprüfungsschleifen bei unsicheren Ergebnissen.

### Skalierbarkeit und Performance

Die parallele Verarbeitung verschiedener Gewerke und die Optimierung der Ressourcennutzung sind entscheidend für die praktische Anwendbarkeit. Das Multi-Agent-System ermöglicht die gleichzeitige Bearbeitung verschiedener Prüfaspekte.

### Kontinuierliche Verbesserung

Ein Feedback-System sammelt Erfahrungen aus der praktischen Anwendung und verbessert kontinuierlich die Prüfregeln und -algorithmen. Machine Learning Ansätze können Muster in erfolgreichen Projekten identifizieren und in die Prüflogik integrieren.

## Integration in den Planungsprozess

Die automatische Planprüfung ist als integraler Bestandteil des Planungsprozesses konzipiert und unterstützt alle HOAI-Leistungsphasen. Frühzeitige Prüfungen in der Entwurfsplanung (LP3) identifizieren grundlegende Probleme, während detaillierte Prüfungen in der Ausführungsplanung (LP5) die technische Umsetzbarkeit sicherstellen.

Die Ergebnisse werden in strukturierten Berichten aufbereitet, die konkrete Handlungsempfehlungen und Verweise auf relevante Normen enthalten. Diese Berichte unterstützen sowohl Planungsbüros bei der Qualitätssicherung als auch ausführende Firmen bei der Vorbereitung der Bauausführung.
