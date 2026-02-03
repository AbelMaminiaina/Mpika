# Mpikarakara

**Assistant personnel IA pour la gestion intelligente du temps et de la vie quotidienne**

Mpikarakara est une application mobile qui aide les utilisateurs à organiser leur emploi du temps de manière optimale et équilibrée, réduisant ainsi leur charge mentale.

## Fonctionnalités principales

- **Gestion des tâches** : Création, modification et suivi des tâches avec catégories, priorités et deadlines
- **Planning intelligent** : Algorithme d'optimisation qui place les tâches aux moments optimaux selon votre profil d'énergie
- **Détection de surcharge** : Calcul en temps réel du score de charge mentale (0-10) avec alertes et suggestions
- **Assistant IA conversationnel** : Chat intégré pour des conseils personnalisés
- **Analytics** : Statistiques de productivité et visualisation de l'équilibre vie pro/perso
- **Synchronisation temps réel** : Multi-appareils via WebSocket

## Architecture

```
Mpika/
├── backend/          # API Node.js + Express
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middlewares/
│   │   ├── config/
│   │   └── utils/
│   └── prisma/       # Schéma et migrations DB
│
├── mobile/           # App React Native + Expo
│   └── src/
│       ├── screens/
│       ├── components/
│       ├── navigation/
│       ├── store/    # Redux Toolkit
│       ├── services/
│       └── utils/
│
├── docker/           # Scripts Docker
├── scripts/          # Scripts de démarrage
└── docker-compose.yml
```

## Stack Technologique

### Backend
- Node.js + Express.js
- Prisma ORM + PostgreSQL (Docker)
- Redis (Docker)
- Socket.io (temps réel)
- JWT (authentification)

### Mobile
- React Native + Expo
- Redux Toolkit
- React Navigation
- React Native Paper

### Infrastructure
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7
- pgAdmin 4

## 🚀 Démarrage rapide

### Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/) >= 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)

### Installation en 3 étapes

#### 1. Cloner et démarrer les conteneurs Docker

```bash
# Cloner le projet
git clone https://github.com/votre-repo/mpikarakara.git
cd mpikarakara

# Démarrer PostgreSQL et Redis
docker-compose up -d postgres redis
```

#### 2. Configurer et lancer le backend

```bash
cd backend

# Installer les dépendances
npm install

# Générer le client Prisma
npm run db:generate

# Créer les tables dans la base de données
npm run db:push

# (Optionnel) Ajouter des données de test
npm run db:seed

# Lancer le serveur
npm run dev
```

#### 3. Lancer l'application mobile

```bash
cd mobile

# Installer les dépendances
npm install

# Lancer Expo
npm start
```

Scanner le QR code avec l'app Expo Go sur votre téléphone.

### Script automatique (Windows PowerShell)

```powershell
.\scripts\start-dev.ps1
```

### Script automatique (Linux/Mac)

```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

## 🐳 Docker

### Commandes utiles

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down

# Réinitialiser les données
docker-compose down -v
```

### Services disponibles

| Service | URL | Credentials |
|---------|-----|-------------|
| PostgreSQL | `localhost:5432` | `mpikarakara` / `mpikarakara_secret_2024` |
| Redis | `localhost:6379` | Password: `mpikarakara_redis_2024` |
| pgAdmin | `http://localhost:5050` | `admin@mpikarakara.com` / `admin123` |
| Backend API | `http://localhost:3000` | - |

### Connexion à PostgreSQL avec pgAdmin

1. Ouvrir `http://localhost:5050`
2. Se connecter avec `admin@mpikarakara.com` / `admin123`
3. Ajouter un serveur :
   - Host: `postgres` (nom du container)
   - Port: `5432`
   - Database: `mpikarakara`
   - Username: `mpikarakara`
   - Password: `mpikarakara_secret_2024`

## 📡 API Endpoints

### Authentification
```
POST /api/auth/register    # Inscription
POST /api/auth/login       # Connexion
GET  /api/auth/me          # Utilisateur courant
POST /api/auth/logout      # Déconnexion
POST /api/auth/refresh     # Rafraîchir le token
```

### Tâches
```
GET    /api/tasks              # Liste des tâches
POST   /api/tasks              # Créer une tâche
GET    /api/tasks/:id          # Détail d'une tâche
PUT    /api/tasks/:id          # Modifier une tâche
DELETE /api/tasks/:id          # Supprimer une tâche
PATCH  /api/tasks/:id/complete # Marquer complétée
```

### Planning
```
GET  /api/schedules/:date           # Planning d'un jour
POST /api/schedules/optimize        # Optimiser le planning
PUT  /api/schedules/:date           # Modifier le planning
GET  /api/schedules/:date/mental-load # Charge mentale
```

### Analytics
```
GET /api/analytics/summary   # Résumé
GET /api/analytics/daily/:date
GET /api/analytics/weekly
GET /api/analytics/monthly
```

### Assistant IA
```
POST /api/ai/chat     # Converser avec l'assistant
POST /api/ai/suggest  # Obtenir des suggestions
```

## 🧮 Algorithme de charge mentale

Le score de charge mentale (0-10) est calculé selon :

| Catégorie | Poids |
|-----------|-------|
| Travail | 1.5 |
| Études | 1.4 |
| Maison | 1.0 |
| Personnel | 0.9 |
| Sport | 0.8 |
| Social | 0.6 |
| Loisirs | 0.5 |
| Repos | 0.2 |

**Formule** : `charge = (Σ(poids × durée_heures) / 12h) × 10`

**Interprétation** :
- 0-3 : Journée légère ✅
- 3-5 : Équilibrée ✅
- 5-7 : Chargée mais gérable ⚠️
- 7-9 : Surcharge (ajustements recommandés) 🔶
- 9-10 : Critique (report obligatoire) 🔴

## 🧪 Compte de test

Après avoir exécuté `npm run db:seed` :

```
Email:    test@mpikarakara.com
Password: Test1234!
```

## 📁 Variables d'environnement

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=3000

# Database (Docker)
DATABASE_URL="postgresql://mpikarakara:mpikarakara_secret_2024@localhost:5432/mpikarakara"

# Redis (Docker)
REDIS_URL="redis://:mpikarakara_redis_2024@localhost:6379"

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AI Service
AI_SERVICE_URL=http://localhost:8000
```

## 🛠 Scripts NPM (Backend)

```bash
npm run dev          # Lancer en mode développement
npm run start        # Lancer en production
npm run db:generate  # Générer le client Prisma
npm run db:push      # Synchroniser le schéma
npm run db:migrate   # Exécuter les migrations
npm run db:seed      # Ajouter des données de test
npm run db:studio    # Ouvrir Prisma Studio
npm run db:reset     # Réinitialiser la base
npm run docker:up    # Démarrer les conteneurs
npm run docker:down  # Arrêter les conteneurs
npm run setup        # Installation complète
```

## 🤝 Contribuer

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT

---

Made with ❤️ by the Mpikarakara team
