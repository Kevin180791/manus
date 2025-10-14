# Hardware-Anforderungen - manus TGA-Plattform

**Übersicht der Hardware-Anforderungen für Entwicklung, Testing und Produktion**

---

## 📋 Zusammenfassung

| Szenario | CPU | RAM | Storage | Netzwerk |
|----------|-----|-----|---------|----------|
| **Entwicklung (lokal)** | 2-4 Cores | 4-8 GB | 10 GB | Standard |
| **Testing (klein)** | 4 Cores | 8 GB | 20 GB | 100 Mbit/s |
| **Produktion (mittel)** | 8 Cores | 16 GB | 100 GB | 1 Gbit/s |
| **Produktion (groß)** | 16+ Cores | 32+ GB | 500 GB | 1 Gbit/s |

---

## 🖥️ Entwicklungsumgebung (Lokal)

**Für**: Einzelne Entwickler, lokales Testing

### Minimum-Anforderungen

**CPU**:
- 2 Cores (Intel i5 / AMD Ryzen 5 oder besser)
- 2.0 GHz Taktfrequenz

**RAM**:
- 4 GB (Minimum)
- 8 GB (Empfohlen)

**Storage**:
- 10 GB freier Speicherplatz
- SSD empfohlen für bessere Performance

**Betriebssystem**:
- Linux (Ubuntu 22.04 LTS empfohlen)
- macOS 12+ (mit Homebrew)
- Windows 10/11 (mit WSL2)

**Software-Voraussetzungen**:
- Python 3.11+
- Node.js 22+
- Git
- Docker (optional, für Containerisierung)

### Empfohlene Konfiguration

**Laptop/Desktop**:
- CPU: 4 Cores (Intel i7 / AMD Ryzen 7)
- RAM: 16 GB
- Storage: 256 GB SSD
- Display: 1920x1080 (für Frontend-Entwicklung)

**Warum?**:
- Backend + Frontend + IDE + Browser gleichzeitig
- Schnelles Hot-Reload
- Komfortables Multitasking

---

## 🧪 Testing-Umgebung

**Für**: Pilotprojekte, Beta-Tests mit 1-5 Nutzern

### Server-Spezifikationen

**CPU**:
- 4 Cores (vCPU)
- 2.5+ GHz

**RAM**:
- 8 GB

**Storage**:
- 20 GB SSD
- 10 GB für System
- 10 GB für Dokumente/Datenbank

**Netzwerk**:
- 100 Mbit/s symmetrisch
- Feste IP oder DynDNS

### Cloud-Optionen

**AWS EC2**:
- Instance-Typ: `t3.medium` oder `t3.large`
- Kosten: ~$30-60/Monat

**Hetzner Cloud**:
- CPX21 (3 vCPU, 4 GB RAM): €5.83/Monat
- CPX31 (4 vCPU, 8 GB RAM): €11.90/Monat

**DigitalOcean**:
- Droplet: 4 GB RAM, 2 vCPU: $24/Monat
- Droplet: 8 GB RAM, 4 vCPU: $48/Monat

---

## 🚀 Produktionsumgebung (Mittel)

**Für**: 10-50 gleichzeitige Nutzer, mehrere Projekte parallel

### Server-Spezifikationen

**CPU**:
- 8 Cores (vCPU)
- 3.0+ GHz
- x86_64 Architektur

**RAM**:
- 16 GB
- Aufteilung:
  - 4 GB: Betriebssystem
  - 6 GB: Backend (FastAPI + Agents)
  - 4 GB: Datenbank (PostgreSQL)
  - 2 GB: Cache/Buffer

**Storage**:
- 100 GB SSD (Minimum)
- 500 GB SSD (Empfohlen)
- Aufteilung:
  - 20 GB: System
  - 30 GB: Anwendung
  - 50-450 GB: Dokumente/Uploads

**Netzwerk**:
- 1 Gbit/s symmetrisch
- Unbegrenzte Traffic oder 10+ TB/Monat
- Feste IP-Adresse

**Backup**:
- Tägliche Backups (inkrementell)
- Wöchentliche Full-Backups
- 30 Tage Retention

### Cloud-Optionen

**AWS EC2**:
- Instance-Typ: `c6i.2xlarge` (8 vCPU, 16 GB RAM)
- EBS: 100 GB gp3 SSD
- Kosten: ~$200-300/Monat

**Hetzner Dedicated**:
- AX41 (AMD Ryzen 5 3600, 64 GB RAM): €39/Monat
- Sehr gutes Preis-Leistungs-Verhältnis

**DigitalOcean**:
- Droplet: 16 GB RAM, 8 vCPU: $96/Monat

---

## 🏢 Produktionsumgebung (Groß)

**Für**: 100+ gleichzeitige Nutzer, Multi-Tenant, High-Availability

### Server-Cluster

**Application Server** (2-3 Instanzen):
- CPU: 8 Cores pro Instanz
- RAM: 16 GB pro Instanz
- Storage: 50 GB SSD pro Instanz
- Load Balancer für Lastverteilung

**Database Server** (1 Primary + 1 Replica):
- CPU: 8-16 Cores
- RAM: 32 GB
- Storage: 500 GB SSD (NVMe empfohlen)
- RAID 10 für Redundanz

**File Storage Server**:
- CPU: 4 Cores
- RAM: 8 GB
- Storage: 1-5 TB HDD/SSD
- S3-kompatibles Object Storage (z.B. MinIO)

**Worker Nodes** (für Agents):
- CPU: 16+ Cores
- RAM: 32+ GB
- Storage: 100 GB SSD
- Skalierbar je nach Last

### Netzwerk

**Bandbreite**:
- 1-10 Gbit/s symmetrisch
- Unbegrenzter Traffic

**Latenz**:
- <50ms zu Hauptnutzern
- CDN für statische Assets

### Cloud-Architektur

**AWS**:
- ECS/EKS für Container-Orchestrierung
- RDS für Datenbank (PostgreSQL)
- S3 für Dokumente
- CloudFront für CDN
- Kosten: ~$1.000-2.000/Monat

**Kubernetes (Self-Hosted)**:
- 3 Master Nodes (4 vCPU, 8 GB RAM)
- 5+ Worker Nodes (8 vCPU, 16 GB RAM)
- Hetzner Cloud: ~€200-400/Monat

---

## 🔮 Zukünftige Anforderungen (mit KI-Features)

### Phase 2: LLM-Integration

**Zusätzlich benötigt**:

**CPU**:
- +4 Cores für LLM-API-Calls
- Oder: GPU für lokale LLM-Inferenz

**RAM**:
- +8 GB für LLM-Context-Caching
- Oder: +16 GB für lokale LLM-Modelle (7B-13B Parameter)

**GPU** (optional, für lokale LLM):
- NVIDIA RTX 4090 (24 GB VRAM)
- NVIDIA A100 (40 GB VRAM) für Produktion
- Oder: Cloud GPU (AWS p3.2xlarge: ~$3/Stunde)

**Kosten-Alternative**: OpenAI API
- Keine GPU nötig
- Pay-per-Use: ~$0.01-0.10 pro Prüfung
- Empfohlen für Start

### Phase 3: Computer Vision (OCR)

**Zusätzlich benötigt**:

**CPU**:
- +4 Cores für OCR-Processing

**RAM**:
- +4 GB für Bild-Processing

**GPU** (optional):
- NVIDIA RTX 3060 (12 GB VRAM) oder besser
- Beschleunigt OCR um Faktor 5-10x

**Storage**:
- +50 GB für OCR-Cache

### Phase 4: Multi-Agent-System (Ray + Temporal)

**Zusätzlich benötigt**:

**Worker Nodes**:
- 5-10 Worker Nodes (je 8 vCPU, 16 GB RAM)
- Für parallele Agent-Ausführung

**Temporal Server**:
- 4 vCPU, 8 GB RAM
- PostgreSQL für Temporal-State

**Ray Cluster**:
- 1 Head Node (4 vCPU, 8 GB RAM)
- 5-10 Worker Nodes (8 vCPU, 16 GB RAM)

**Gesamt-Anforderungen**:
- CPU: 64+ Cores
- RAM: 128+ GB
- Storage: 1+ TB

---

## 💾 Datenbank-Anforderungen

### Entwicklung

**SQLite**:
- Keine separaten Anforderungen
- Datei-basiert (~100 MB pro Projekt)

### Produktion

**PostgreSQL**:
- CPU: 4-8 Cores
- RAM: 8-32 GB (je nach Datenmenge)
- Storage: 100-500 GB SSD
- IOPS: 3.000+ (SSD/NVMe)

**Datenwachstum** (Schätzung):
- Pro Projekt: 50-200 MB (Metadaten + extrahierte Texte)
- Pro Dokument: 5-20 MB (Original + OCR)
- 100 Projekte: ~10-20 GB
- 1.000 Projekte: ~100-200 GB

---

## 📦 Storage-Anforderungen

### Dokument-Storage

**Entwicklung**:
- 10 GB (für 10-20 Test-Projekte)

**Produktion (klein)**:
- 100 GB (für 100-200 Projekte)

**Produktion (mittel)**:
- 500 GB (für 500-1.000 Projekte)

**Produktion (groß)**:
- 1-5 TB (für 1.000-10.000 Projekte)

### Backup-Storage

**Regel**: 3x Datenvolumen
- Tägliche Backups (7 Tage): 1x
- Wöchentliche Backups (4 Wochen): 1x
- Monatliche Backups (12 Monate): 1x

**Beispiel**:
- Produktiv-Daten: 500 GB
- Backup-Storage: 1.5 TB

---

## 🌐 Netzwerk-Anforderungen

### Bandbreite

**Upload** (wichtiger):
- Entwicklung: 10 Mbit/s
- Produktion (klein): 100 Mbit/s
- Produktion (mittel): 500 Mbit/s
- Produktion (groß): 1 Gbit/s

**Download**:
- Entwicklung: 50 Mbit/s
- Produktion: 100-1.000 Mbit/s

### Traffic-Schätzung

**Pro Nutzer/Monat**:
- Uploads: 500 MB - 2 GB (Pläne)
- Downloads: 100 MB - 500 MB (CSV, Berichte)
- API-Requests: 10 MB

**Gesamt** (100 Nutzer):
- Upload: 50-200 GB/Monat
- Download: 10-50 GB/Monat
- Gesamt: 60-250 GB/Monat

---

## 💰 Kosten-Übersicht

### Entwicklung (Lokal)

**Einmalig**:
- Laptop/Desktop: €800-1.500 (falls neu)

**Monatlich**:
- €0 (lokale Entwicklung)

### Testing (Cloud)

**Monatlich**:
- Server: €10-50
- Backup: €5-10
- Domain/SSL: €2-5
- **Gesamt**: €20-65/Monat

### Produktion (Mittel)

**Monatlich**:
- Server: €100-300
- Datenbank: €50-100
- Storage: €20-50
- Backup: €20-40
- CDN: €10-30
- Monitoring: €10-20
- **Gesamt**: €210-540/Monat

### Produktion (Groß)

**Monatlich**:
- Server-Cluster: €500-1.500
- Datenbank: €200-500
- Storage: €100-300
- Backup: €100-200
- CDN: €50-150
- Monitoring: €50-100
- **Gesamt**: €1.000-2.750/Monat

---

## 🎯 Empfehlungen

### Für den Start (jetzt)

**Option 1: Lokal entwickeln**
- Laptop mit 16 GB RAM
- Kosten: €0/Monat
- Für: Entwicklung + erste Tests

**Option 2: Kleiner Cloud-Server**
- Hetzner CPX31 (4 vCPU, 8 GB RAM)
- Kosten: €12/Monat
- Für: Beta-Tests mit Pilotkunden

### Für Pilotphase (3-6 Monate)

**Hetzner Cloud**:
- CPX41 (8 vCPU, 16 GB RAM): €23.90/Monat
- 100 GB Storage: €5/Monat
- Backup: €5/Monat
- **Gesamt**: ~€35/Monat

### Für Produktiv-Start (ab 10 Kunden)

**Hetzner Dedicated**:
- AX41 (AMD Ryzen 5 3600, 64 GB RAM): €39/Monat
- Sehr gutes Preis-Leistungs-Verhältnis
- Skalierbar bis 50+ Nutzer

### Für Wachstum (ab 50 Kunden)

**Kubernetes-Cluster**:
- 3 Master + 5 Worker Nodes
- Hetzner Cloud: ~€200/Monat
- Oder AWS EKS: ~€500/Monat

---

## 📊 Performance-Benchmarks

### Aktuelle Implementierung (regelbasiert)

**Ausführungsreife-Prüfung**:
- 1 Projekt, 10 Dokumente: <5 Sekunden
- CPU-Last: 1 Core, 50-70%
- RAM-Nutzung: ~200 MB

**Materiallisten-Generierung**:
- 1 Gewerk, 20 Pläne: <30 Sekunden
- CPU-Last: 1 Core, 60-80%
- RAM-Nutzung: ~300 MB

**Gleichzeitige Nutzer** (8 vCPU, 16 GB RAM):
- 10 Nutzer: Keine Probleme
- 50 Nutzer: Leichte Verzögerungen
- 100 Nutzer: Queue-System nötig

### Mit LLM-Integration (geplant)

**Ausführungsreife-Prüfung**:
- 1 Projekt, 10 Dokumente: 30-60 Sekunden
- CPU-Last: 2 Cores, 80-90%
- RAM-Nutzung: ~1 GB
- API-Kosten: ~$0.05-0.10 pro Prüfung

**Gleichzeitige Nutzer** (16 vCPU, 32 GB RAM):
- 10 Nutzer: Keine Probleme
- 50 Nutzer: Moderate Verzögerungen
- 100 Nutzer: Dedizierte Worker nötig

---

## ✅ Checkliste für Deployment

### Vor dem Start

- [ ] Server-Spezifikationen festgelegt
- [ ] Cloud-Provider ausgewählt
- [ ] Budget genehmigt
- [ ] Backup-Strategie definiert
- [ ] Monitoring-Tools ausgewählt

### Deployment

- [ ] Server provisioniert
- [ ] Datenbank eingerichtet
- [ ] SSL-Zertifikat installiert
- [ ] Firewall konfiguriert
- [ ] Backup automatisiert
- [ ] Monitoring aktiviert

### Nach dem Start

- [ ] Performance-Tests durchgeführt
- [ ] Load-Tests durchgeführt
- [ ] Backup-Restore getestet
- [ ] Disaster-Recovery-Plan erstellt

---

## 📞 Fazit

**Für den Start** (Entwicklung + Beta-Tests):
- **Laptop**: 16 GB RAM, 4 Cores
- **Cloud**: Hetzner CPX31 (€12/Monat)
- **Gesamt**: <€50/Monat

**Für Produktion** (10-50 Kunden):
- **Server**: Hetzner AX41 (€39/Monat)
- **Backup**: €10/Monat
- **Gesamt**: ~€50/Monat

**Für Skalierung** (100+ Kunden):
- **Cluster**: Kubernetes (€200-500/Monat)
- **Mit KI**: +€200-500/Monat
- **Gesamt**: €400-1.000/Monat

Die Plattform ist **sehr ressourcenschonend** in der aktuellen Implementierung und kann mit minimalen Kosten gestartet werden!

