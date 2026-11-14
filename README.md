# 📄 PDF2WORD PRO — Version Web & Cloud Ready avec Moteur OCR Avancé

Bienvenue dans **PDF2WORD PRO**, une application web moderne, hautement performante et prête pour la production, conçue pour convertir des documents PDF (numériques ou scannés) en fichiers **Microsoft Word (.docx) modifiables**.

L'application allie la robustesse d'un backend Python haute performance (FastAPI, PyMuPDF, python-docx, Tesseract OCR 5) et l'élégance d'une interface web moderne (React 19, TypeScript, TailwindCSS v4, Lucide Icons).

---

## ✨ Fonctionnalités Clés

### 🧠 Moteur de Conversion Hybride & OCR Intelligent
- **Conversion native ultra-rapide** : Analyse vectorielle des textes, polices, tableaux et images avec préservation de la structure.
- **Moteur OCR pour PDF Scannés** : Détection automatique des documents numérisés sans couche texte exploitable.
- **Rendu 300 DPI & Filtres d'amélioration** : Rehaussement du contraste (x1.8), passage en niveaux de gris et affinage de la netteté pour une fidélité de reconnaissance maximale avec **Tesseract OCR (Français + Anglais)**.
- **Modes de conversion configurables** :
  - `auto` : Analyse et applique l'OCR uniquement sur les pages scannées.
  - `force_ocr` : Force la reconnaissance optique sur l'intégralité du document (idéal pour les reçus, factures ou attestations photo).
  - `no_ocr` : Extraction textuelle numérique uniquement.
- **Détection des tableaux et mise en page** : Restitution des tableaux Word stylisés (en-têtes bleus `#1E3A8A`, bordures fines, colonnes adaptées) et intégration des images.

### 🌐 Architecture Web Unifiée (Single-Port Hosting)
- **Port Unique (8000)** : Le backend FastAPI sert simultanément l'API REST (`/api/*`) et la Single-Page Application (SPA) React compilée (`/`).
- **Prêt pour le déploiement cloud** : Dockerfile multi-étape, configuration Render (`render.yaml`), Railway / Heroku (`Procfile`), docker-compose, et scripts de démarrage instantané.
- **Zéro fuite de données** : Le traitement s'exécute intégralement sur votre machine ou votre conteneur sans aucun appel vers des API tierces ou payantes.

### 🎨 Interface Utilisateur SaaS Premium
- **Glisser-Déposer & Traitement par lot** : Importation de plusieurs fichiers simultanément.
- **Téléchargement individuel ou Archive ZIP** : Récupération des documents Word convertis en un clic.
- **Historique interactif** : Consultation des conversions antérieures, vérification de la présence des fichiers sur disque, suppression sélective et recherche instantanée.
- **Paramètres personnalisables** : Thème Clair / Sombre, Langues (Français / Anglais), résolution OCR (150 à 400 DPI), règles de nommage et diagnostics système en direct.

---

## 📁 Structure du Projet

```text
pdf2word/
├── backend/
│   ├── app/
│   │   ├── config.py              # Configuration, détection Tesseract, dossiers
│   │   ├── main.py                # Point d'entrée FastAPI & service de la SPA
│   │   ├── routes/                # Endpoints API (/convert, /download, /history, /settings)
│   │   ├── schemas/               # Modèles de données Pydantic
│   │   ├── services/              # Moteur hybride, OCR Tesseract, historique, nettoyeur
│   │   └── utils/                 # Sécurité, validation PDF, assainissement de noms
│   ├── tests/                     # Tests automatisés pytest & échantillons
│   └── requirements.txt           # Dépendances Python
├── frontend/
│   ├── src/                       # Application React TypeScript
│   │   ├── components/            # Navbar, DropZone, FileList, ResultCard, History, Settings, About
│   │   ├── i18n/                  # Dictionnaires FR & EN
│   │   └── types/                 # Interfaces TypeScript
│   ├── dist/                      # SPA compilée prête pour la production
│   └── package.json
├── storage/
│   ├── uploads/                   # Fichiers sources temporaires
│   ├── outputs/                   # Documents .docx générés
│   └── temp/                      # Pages intermédiaires OCR
├── Dockerfile                     # Image de production multi-stage
├── docker-compose.yml             # Orchestration avec volume persistant
├── render.yaml                    # Déploiement 1-clic Render.com
├── Procfile                       # Déploiement Railway / Heroku
├── start.bat                      # Lancement 1-clic sous Windows
├── start.sh                       # Lancement 1-clic sous Linux / macOS
└── README.md
```

---

## 🚀 Démarrage Rapide

### Option A : Lancement Local sous Windows (Recommandé)

Double-cliquez simplement sur le script :
```cmd
start.bat
```
Ou dans PowerShell / Terminal :
```powershell
cd pdf2word
.\start.bat
```
Le serveur démarrera automatiquement et sera accessible sur :
👉 **http://localhost:8000**

---

### Option B : Lancement Local Manuel

1. **Activer l'environnement Python** :
```bash
cd pdf2word
python -m venv .venv
source .venv/bin/activate       # Sous Linux / Mac
# ou sous Windows :
.venv\Scripts\activate

pip install -r backend/requirements.txt
```

2. **Compiler le Frontend** :
```bash
cd frontend
npm install
npm run build
cd ..
```

3. **Lancer le serveur unifié** :
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
Rendez-vous sur `http://localhost:8000` !

---

### Option C : Déploiement avec Docker & Docker Compose

L'image Docker installe automatiquement Python 3.11, Tesseract OCR avec les dictionnaires français et anglais, compile le frontend et configure le serveur de production.

```bash
cd pdf2word
docker compose up --build -d
```
L'application est immédiatement disponible sur `http://localhost:8000`.

---

## ☁️ Hébergement Cloud en Ligne

### 1. Déploiement sur Render.com
1. Poussez le dossier `pdf2word` sur votre dépôt GitHub ou GitLab.
2. Connectez-vous sur [Render.com](https://render.com).
3. Créez un nouveau **Web Service** et liez votre dépôt.
4. Sélectionnez le runtime **Docker** (Render détectera automatiquement le fichier `Dockerfile` ou le fichier `render.yaml`).
5. Cliquez sur **Deploy** : Votre instance sera accessible publiquement avec certificat HTTPS automatique !

### 2. Déploiement sur Railway.app
1. Créez un projet sur [Railway.app](https://railway.app).
2. Déployez depuis votre dépôt GitHub.
3. Railway utilisera le `Dockerfile` ou le `Procfile` et allouera un domaine public.

### 3. Déploiement sur VPS (Ubuntu / Debian)
Installez Docker puis exécutez :
```bash
git clone <votre-repo>
cd pdf2word
docker compose up -d
```
Vous pouvez ensuite placer Nginx ou Traefik en reverse proxy pour associer votre nom de domaine avec SSL (Let's Encrypt).

---

## 🧪 Tests Automatisés

Le projet comprend une suite complète de tests de validation (conversion native, OCR, scans, tables, sécurité, API) :

```bash
cd pdf2word
.venv\Scripts\python -m pytest backend/tests -v
```

Résultats : **10 tests sur 10 validés (100% de réussite)**.

---

## 🛡️ Sécurité & Confidentialité
- **Assainissement des noms de fichiers** : Protection contre le *Path Traversal* et les injections de caractères malveillants.
- **Validation d'en-tête binaire** : Vérification du magic header `%PDF-` pour interdire l'exécution de scripts déguisés.
- **Nettoyage automatique** : Les fichiers temporaires de traitement sont supprimés après la conversion.
- **Aucune dépendance externe** : Aucun envoi de vos documents vers OpenAI, Google Cloud ou des serveurs tiers.
