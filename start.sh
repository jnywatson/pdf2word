#!/bin/bash
set -e

echo "========================================================"
echo "      PDF2WORD PRO - Démarrage du Serveur Web"
echo "========================================================"

cd "$(dirname "$0")"

# Activate venv if present
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Build frontend if dist missing
if [ ! -f "frontend/dist/index.html" ]; then
    echo "[*] Construction de l'interface frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
fi

PORT="${PORT:-8000}"
HOST="${HOST:-0.0.0.0}"

echo "[OK] Lancement sur http://${HOST}:${PORT}"
exec uvicorn backend.app.main:app --host "$HOST" --port "$PORT"
