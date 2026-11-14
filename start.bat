@echo off
chcp 65001 >nul
echo ========================================================
echo       PDF2WORD PRO - Démarrage du Serveur Web Local
echo ========================================================
echo.

cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo [!] Environnement virtuel Python introuvable dans .venv
    echo [*] Création de l'environnement virtuel...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    echo [*] Installation des dépendances Python...
    pip install -r backend\requirements.txt
) else (
    call .venv\Scripts\activate.bat
)

if not exist "frontend\dist\index.html" (
    echo [*] Compilation de l'interface Web (Frontend)...
    cd frontend
    call npm install
    call npm run build
    cd ..
)

echo.
echo [OK] Serveur prêt !
echo [OK] Accédez à l'application dans votre navigateur :
echo.
echo      👉 http://localhost:8000
echo.
echo Appuyez sur Ctrl+C pour arrêter le serveur.
echo.

python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause
