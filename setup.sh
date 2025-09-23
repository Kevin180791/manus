
#!/bin/bash
echo "Starte OpenManus KI-Plattform Setup..."

# Python-Abhängigkeiten installieren
cd backend
pip install -r requirements.txt

# Datenbankmigration placeholder
echo "Alembic-Migrationen vorbereiten (Platzhalter)"
# alembic upgrade head

# Server starten
echo "Starte FastAPI Backend auf Port 8001"
uvicorn main:app --host 0.0.0.0 --port 8001
