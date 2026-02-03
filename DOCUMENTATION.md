# Mpikarakara - Documentation Technique

## 📱 Présentation

**Mpikarakara** est une application mobile intelligente de gestion du temps et de la vie quotidienne. Elle combine la gestion de tâches traditionnelle avec un algorithme d'optimisation d'emploi du temps et une détection de la charge mentale.

### Fonctionnalités Principales

- ✅ **Gestion des tâches** - Création, modification, catégorisation et suivi des tâches
- 📅 **Optimisation d'emploi du temps** - Planification intelligente basée sur les priorités et l'énergie
- 🧠 **Détection de charge mentale** - Score de 0 à 10 avec alertes et recommandations
- 💬 **Assistant IA conversationnel** - Aide à la planification et conseils personnalisés
- 📊 **Analytics et insights** - Visualisation des tendances et de la productivité

---

## 🏗️ Architecture

```
mpikarakara/
├── backend/                 # API Node.js + Express
│   ├── prisma/             # ORM et schéma de base de données
│   ├── src/
│   │   ├── config/         # Configuration (DB, Redis, JWT)
│   │   ├── controllers/    # Logique métier des endpoints
│   │   ├── middlewares/    # Auth, validation, rate limiting
│   │   ├── routes/         # Définition des routes API
│   │   ├── services/       # Services métier (scheduling, etc.)
│   │   └── server.js       # Point d'entrée
│   └── package.json
│
├── mobile/                  # Application React Native + Expo
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── navigation/     # Configuration de la navigation
│   │   ├── screens/        # Écrans de l'application
│   │   ├── services/       # Services API et utilitaires
│   │   └── store/          # État global Redux
│   └── package.json
│
├── docker/                  # Scripts d'initialisation Docker
├── docker-compose.yml       # Configuration des services
└── DOCUMENTATION.md         # Ce fichier
```

---

## 🛠️ Stack Technique

### Frontend (Mobile)
| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| React Native | 0.74+ | Framework mobile |
| Expo | SDK 51 | Toolchain et build |
| Redux Toolkit | 2.x | Gestion d'état |
| React Navigation | 6.x | Navigation |
| React Native Paper | 5.x | Composants UI |
| Axios | 1.x | Client HTTP |

### Backend
| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| Node.js | 20 LTS | Runtime |
| Express.js | 4.x | Framework API |
| Prisma | 5.x | ORM |
| PostgreSQL | 16 | Base de données |
| Redis | 7 | Cache et sessions |
| JWT | - | Authentification |
| Socket.io | 4.x | Temps réel |

---

## 📊 Modèle de Données

### User (Utilisateur)
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  firstName     String
  lastName      String
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  profile       UserProfile?
  tasks         Task[]
  schedules     Schedule[]
  analytics     Analytics[]
  conversations Conversation[]
}
```

### Task (Tâche)
```prisma
model Task {
  id          String     @id @default(uuid())
  title       String
  description String?
  category    Category   // WORK, STUDY, HOUSEHOLD, etc.
  priority    Priority   // LOW, MEDIUM, HIGH, URGENT
  status      TaskStatus // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  dueDate     DateTime?
  duration    Int        // Durée en minutes
  isRecurring Boolean    @default(false)
  userId      String
}
```

### UserProfile (Profil)
```prisma
model UserProfile {
  id               String   @id @default(uuid())
  userId           String   @unique
  energyProfile    Json     // {morning, afternoon, evening}
  workingHours     Json     // {start, end}
  preferredBreaks  Int      @default(15)
  mentalLoadLimit  Float    @default(7.0)
  notifications    Boolean  @default(true)
}
```

### Categories de Tâches
- `WORK` - Travail professionnel
- `STUDY` - Études et apprentissage
- `HOUSEHOLD` - Tâches ménagères
- `PERSONAL` - Développement personnel
- `SPORT` - Activités physiques
- `SOCIAL` - Vie sociale
- `LEISURE` - Loisirs
- `REST` - Repos

---

## 🧠 Algorithme de Charge Mentale

### Poids par Catégorie
```javascript
const CATEGORY_WEIGHTS = {
  WORK: 1.5,      // Plus exigeant mentalement
  STUDY: 1.4,
  HOUSEHOLD: 1.0,
  PERSONAL: 0.9,
  SPORT: 0.8,     // Effort physique, moins mental
  SOCIAL: 0.6,
  LEISURE: 0.5,
  REST: 0.2,      // Récupération
};
```

### Formule de Calcul
```
Charge Mentale = (Σ (poids_catégorie × durée_heures) / 12h) × 10
```

**Exemple:**
- 4h de travail (WORK): 4 × 1.5 = 6.0
- 2h d'étude (STUDY): 2 × 1.4 = 2.8
- 1h de sport (SPORT): 1 × 0.8 = 0.8
- **Total**: (6.0 + 2.8 + 0.8) / 12 × 10 = **8.0/10**

### Niveaux de Charge
| Score | Niveau | Couleur | Recommandation |
|-------|--------|---------|----------------|
| 0-3 | Léger | 🟢 Vert | Capacité disponible |
| 4-6 | Modéré | 🟡 Jaune | Équilibré |
| 7-8 | Élevé | 🟠 Orange | Réduire les activités |
| 9-10 | Critique | 🔴 Rouge | Repos nécessaire |

---

## 🔌 API Endpoints

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/logout` | Déconnexion |
| POST | `/api/auth/refresh` | Rafraîchir le token |
| GET | `/api/auth/me` | Profil utilisateur |

### Tâches
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/tasks` | Liste des tâches |
| POST | `/api/tasks` | Créer une tâche |
| GET | `/api/tasks/:id` | Détail d'une tâche |
| PUT | `/api/tasks/:id` | Modifier une tâche |
| DELETE | `/api/tasks/:id` | Supprimer une tâche |
| PATCH | `/api/tasks/:id/status` | Changer le statut |

### Emploi du temps
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/schedule` | Emploi du temps actuel |
| POST | `/api/schedule/generate` | Générer un emploi du temps optimisé |
| PUT | `/api/schedule/:id` | Modifier l'emploi du temps |
| GET | `/api/schedule/suggestions` | Suggestions d'optimisation |

### Profil
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/profile` | Récupérer le profil |
| PUT | `/api/profile` | Mettre à jour le profil |
| PUT | `/api/profile/energy` | Modifier le profil énergétique |

### Analytics
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/analytics/overview` | Vue d'ensemble |
| GET | `/api/analytics/mental-load` | Historique charge mentale |
| GET | `/api/analytics/productivity` | Stats de productivité |
| GET | `/api/analytics/trends` | Tendances |

### Chat IA
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/chat/conversations` | Liste des conversations |
| POST | `/api/chat/conversations` | Nouvelle conversation |
| GET | `/api/chat/conversations/:id` | Messages d'une conversation |
| POST | `/api/chat/conversations/:id/messages` | Envoyer un message |

---

## ⚙️ Configuration

### Variables d'Environnement (Backend)

```env
# Serveur
NODE_ENV=development
PORT=3000

# Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5433/mpikarakara?schema=public"

# Redis
REDIS_URL="redis://:password@localhost:6379"

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Docker Compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5433:5432"
    environment:
      POSTGRES_USER: mpikarakara
      POSTGRES_PASSWORD: postgres123
      POSTGRES_DB: mpikarakara

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass redis123
```

---

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 20 LTS
- Docker et Docker Compose
- Expo CLI (`npm install -g expo-cli`)

### 1. Démarrer les services Docker
```bash
docker-compose up -d
```

### 2. Configurer le Backend
```bash
cd backend
cp .env.example .env  # Configurer les variables
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 3. Lancer l'Application Mobile
```bash
cd mobile
npm install
npm start  # ou expo start
```

### 4. Compte de Test
- **Email:** test@mpikarakara.com
- **Mot de passe:** Test1234!

---

## 📱 Écrans de l'Application

### 1. Authentification
- **LoginScreen** - Connexion avec email/mot de passe
- **RegisterScreen** - Inscription avec validation
- **OnboardingScreen** - Configuration initiale du profil

### 2. Tableau de Bord
- **DashboardScreen** - Vue d'ensemble avec:
  - Jauge de charge mentale
  - Tâches du jour
  - Timeline de l'emploi du temps
  - Statistiques rapides

### 3. Gestion des Tâches
- **TasksScreen** - Liste et filtres des tâches
- **TaskDetailScreen** - Détail et modification
- **AddTaskScreen** - Création de tâche

### 4. Calendrier
- **CalendarScreen** - Vue calendrier avec emploi du temps

### 5. Assistant IA
- **ChatScreen** - Interface de conversation avec l'assistant

### 6. Profil
- **ProfileScreen** - Paramètres et préférences utilisateur

---

## 🔐 Sécurité

### Authentification
- Tokens JWT avec expiration configurable
- Refresh tokens pour renouvellement
- Hachage des mots de passe avec bcrypt (12 rounds)

### Protection API
- Rate limiting par IP
- Validation des entrées avec express-validator
- Headers de sécurité avec Helmet
- CORS configuré

### Bonnes Pratiques
- Variables sensibles dans `.env` (jamais commitées)
- Validation côté serveur de toutes les entrées
- Sanitization des données utilisateur

---

## 📈 Roadmap

### Version 1.0 (MVP)
- [x] Authentification utilisateur
- [x] Gestion des tâches CRUD
- [x] Calcul de charge mentale
- [x] Emploi du temps basique
- [ ] Tests unitaires
- [ ] CI/CD

### Version 1.1
- [ ] Notifications push
- [ ] Mode hors-ligne
- [ ] Synchronisation temps réel

### Version 2.0
- [ ] Assistant IA (intégration LLM)
- [ ] Reconnaissance vocale
- [ ] Widgets

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 📞 Contact

Pour toute question ou suggestion, ouvrir une issue sur le dépôt GitHub.

---

*Documentation générée le 3 février 2026*
