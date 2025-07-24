# Hanalytics – Démarrage rapide

## 1. Prérequis

- Node.js ≥ 18.x
- npm ≥ 9.x
- Un projet Google Cloud avec BigQuery configuré
- Un compte Vercel (pour le déploiement cloud)

---

## 2. Installation locale

### a. Cloner le dépôt

```bash
git clone <repo-url>
cd hanalytics-react
```

### b. Installer les dépendances

```bash
cd api
npm install
```
> Le build du frontend est lancé automatiquement via le script postinstall.

---

## 3. Configuration des variables d’environnement

### a. Backend (`.env` à la racine)

Crée un fichier `.env` à la racine du projet avec le contenu suivant :

```
GOOGLE_CLOUD_PROJECT=ton-projet-gcp
GOOGLE_APPLICATION_CREDENTIALS=./api/credentials/credentials.json
BIGQUERY_DATASET=ton_dataset
```

- `GOOGLE_CLOUD_PROJECT` : ID de ton projet Google Cloud
- `GOOGLE_APPLICATION_CREDENTIALS` : Chemin vers le fichier de credentials JSON (relatif à la racine du projet)
- `BIGQUERY_DATASET` : Nom du dataset BigQuery utilisé

### b. Frontend (`frontend/.env.local`)

Crée un fichier `frontend/.env.local` avec le contenu suivant :

```
REACT_APP_API_URL=http://localhost:4000/api
```

- `REACT_APP_API_URL` : URL de l’API backend en local

### c. Credentials Google Cloud

1. Va sur la console Google Cloud > IAM & Admin > Comptes de service
2. Crée un compte de service avec accès BigQuery
3. Génère une clé JSON et télécharge-la
4. Place ce fichier dans :  
   `api/credentials/credentials.json`
5. Vérifie que le chemin correspond à la variable dans `.env`

---

## 4. Lancement en local

### a. Démarrer le backend (API + build frontend inclus)

```bash
cd api
npm start
```
- L’API écoute sur [http://localhost:4000](http://localhost:4000) et sert le frontend sur le même port.

### b. Démarrer le frontend en mode développement

```bash
cd frontend
npm start
```
- Le frontend sera accessible sur [http://localhost:3000](http://localhost:3000) (proxy vers l’API).

---

## 5. Déploiement sur Vercel (Fullstack)

Le projet est conçu pour être déployé **en un seul projet sur Vercel** : le backend Express sert aussi le frontend React en production. Il n’y a pas besoin de backend séparé.

### a. Connecter le repo à Vercel

- Va sur [vercel.com](https://vercel.com), connecte ton repo GitHub.

### b. Variables d’environnement à configurer sur Vercel

Dans le dashboard Vercel, ajoute ces variables d’environnement :

- `REACT_APP_API_URL=/api` (pour le frontend)
- `GOOGLE_CLOUD_PROJECT` (backend)
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` (backend, voir ci-dessous)
- `BIGQUERY_DATASET` (backend)

**Pour les credentials Google Cloud** : 
- Copier le contenu du credentials dans le champs valeur de GOOGLE_APPLICATION_CREDENTIALS_JSON sur Vercel
- Sinon, tu peux uploader le fichier dans le repo (attention à la sécurité !) et référencer son chemin dans la variable `GOOGLE_APPLICATION_CREDENTIALS`.

### c. Déployer

- Vercel détecte automatiquement le projet fullstack (Express + React).
- Toutes les requêtes (API et frontend) sont servies par le backend Express via `api/index.js`.
- Le frontend appelle l’API via `/api` (même domaine, pas de CORS).

---

## 6. Résumé des emplacements des fichiers

- `.env` (à la racine) : variables backend (pour le dev local)
- `frontend/.env.local` : variables frontend (pour le dev local)
- `api/credentials/credentials.json` : credentials Google Cloud (pour le dev local)

En production sur Vercel, toutes les variables d’environnement sont à renseigner dans le dashboard Vercel.
