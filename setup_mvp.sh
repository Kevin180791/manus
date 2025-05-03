#!/bin/bash
echo "[+] Starte Setup der MVP-Umgebung..."
docker compose pull
docker compose up -d
echo "[+] Demo-Daten kopieren..."
cp ./data/projektidee.pdf ./backend/data/
echo "[+] Setup abgeschlossen! Webinterface unter http://localhost:3000"
