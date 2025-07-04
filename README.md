# 🔐 Next.js Auth 2FA Demo

**Démonstration complète d'un système d'authentification Next.js avec authentification à deux facteurs (A2F) par email**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3+-38B2AC)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5+-2D3748)](https://www.prisma.io/)

## 🎯 Aperçu du Projet

Ce projet est une démonstration complète d'un système d'authentification moderne et sécurisé construit avec Next.js 14, TypeScript, et les meilleures pratiques de sécurité. Il implémente l'authentification à deux facteurs (2FA) par email, la gestion de sessions sécurisées, et une architecture de sécurité robuste.

### 🌟 Fonctionnalités Principales

#### 🔑 Authentification Core
- ✅ **Inscription sécurisée** avec validation de mot de passe forte
- ✅ **Connexion avec 2FA obligatoire** via email
- ✅ **Gestion de sessions JWT** avec refresh tokens
- ✅ **Déconnexion sécurisée** avec invalidation de session
- ✅ **Protection des routes** avec middleware automatique

#### 🛡️ Authentification à Deux Facteurs (2FA)
- ✅ **Codes à 6 chiffres** générés de manière sécurisée
- ✅ **Envoi par email** avec templates HTML professionnels
- ✅ **Expiration automatique** des codes (5 minutes)
- ✅ **Protection contre les tentatives multiples** (3 essais max)
- ✅ **Interface utilisateur intuitive** avec saisie automatique

#### 🔒 Sécurité Avancée
- ✅ **Hashage bcrypt** des mots de passe avec salt
- ✅ **Rate limiting intelligent** avec différents niveaux
- ✅ **Protection CSRF** et headers de sécurité
- ✅ **Validation Zod** côté client et serveur
- ✅ **Audit logging** complet des actions de sécurité
- ✅ **Détection d'activités suspectes** et monitoring
- ✅ **Gestion de sessions** avec fingerprinting
- ✅ **Protection XSS et injection SQL**

#### 🎨 Interface Utilisateur
- ✅ **Design moderne** avec Tailwind CSS
- ✅ **Responsive design** mobile-first
- ✅ **Mode sombre** intégré
- ✅ **Animations fluides** et micro-interactions
- ✅ **Composants réutilisables** avec TypeScript
- ✅ **Accessibilité (a11y)** respectée
- ✅ **États de chargement** et feedback utilisateur

#### 📊 Dashboard & Monitoring
- ✅ **Dashboard utilisateur** avec statistiques de sécurité
- ✅ **Gestion des sessions actives**
- ✅ **Historique de connexions**
- ✅ **Paramètres de sécurité**

## 🏗️ Architecture Technique

### Stack Technologique

**Frontend:**
- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique pour la robustesse
- **Tailwind CSS** - Framework CSS utilitaire
- **React Hook Form** - Gestion des formulaires
- **Zod** - Validation de schémas
- **Lucide React** - Icônes modernes

**Backend:**
- **Next.js API Routes** - API REST intégrée
- **Prisma** - ORM moderne pour TypeScript
- **SQLite** - Base de données (facile pour la démo)
- **bcryptjs** - Hashage sécurisé des mots de passe
- **jsonwebtoken** - Gestion JWT
- **Nodemailer** - Service d'envoi d'emails

**Sécurité:**
- **Middleware Next.js** - Protection des routes
- **Rate Limiting** - Protection contre les attaques
- **CSRF Protection** - Tokens anti-CSRF
- **Security Headers** - Headers HTTP sécurisés
- **Input Validation** - Validation stricte des entrées
- **Audit Logging** - Journalisation complète

### Structure du Projet

```
📁 nextjs-auth-2fa-demo/
├── 📁 prisma/
│   └── schema.prisma          # Schéma de base de données
├── 📁 src/
│   ├── 📁 app/                # App Router Next.js 14
│   │   ├── 📁 (auth)/         # Routes d'authentification
│   │   │   ├── login/         # Page de connexion
│   │   │   ├── register/      # Page d'inscription
│   │   │   └── verify-2fa/    # Vérification 2FA
│   │   ├── 📁 api/            # Routes API
│   │   │   ├── auth/          # Endpoints d'authentification
│   │   │   ├── 2fa/           # Endpoints 2FA
│   │   │   └── security/      # Endpoints de sécurité
│   │   ├── 📁 dashboard/      # Zone protégée
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Page d'accueil
│   │   └── globals.css        # Styles globaux
│   ├── 📁 components/
│   │   ├── 📁 ui/             # Composants UI réutilisables
│   │   ├── 📁 auth/           # Composants d'authentification
│   │   └── 📁 forms/          # Composants de formulaires
│   ├── 📁 lib/
│   │   ├── auth.ts            # Service d'authentification
│   │   ├── db.ts              # Configuration Prisma
│   │   ├── email.ts           # Service d'email
│   │   ├── twofa.ts           # Service 2FA
│   │   ├── security.ts        # Utilitaires de sécurité
│   │   ├── error-handler.ts   # Gestion d'erreurs
│   │   ├── session-manager.ts # Gestion de sessions
│   │   ├── validations.ts     # Schémas Zod
│   │   ├── constants.ts       # Constantes
│   │   └── utils.ts           # Utilitaires
│   ├── 📁 types/
│   │   ├── auth.ts            # Types d'authentification
│   │   └── api.ts             # Types API
│   └── middleware.ts          # Middleware de protection
├── .env.example               # Variables d'environnement
├── package.json               # Dépendances
├── tailwind.config.ts         # Configuration Tailwind
├── tsconfig.json              # Configuration TypeScript
└── README.md                  # Documentation
```

## 🚀 Installation et Configuration

### Prérequis

- **Node.js** 18+ 
- **npm** ou **yarn** ou **pnpm**
- **Compte email** (Gmail recommandé pour SMTP)

### 1. Cloner le Repository

```bash
git clone https://github.com/creach-t/nextjs-auth-2fa-demo.git
cd nextjs-auth-2fa-demo
```

### 2. Installer les Dépendances

```bash
# Avec npm
npm install

# Avec yarn
yarn install

# Avec pnpm
pnpm install
```

### 3. Configuration des Variables d'Environnement

Copiez le fichier d'exemple et configurez vos variables :

```bash
cp .env.example .env.local
```

Éditez `.env.local` avec vos valeurs :

```env
# Base de données
DATABASE_URL="file:./dev.db"

# Secrets JWT (générez des clés sécurisées)
JWT_SECRET="votre-cle-jwt-super-secrete-32-caracteres-minimum"
JWT_REFRESH_SECRET="votre-cle-refresh-jwt-differente-32-caracteres"

# Configuration Email (Gmail)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="votre.email@gmail.com"
EMAIL_PASS="votre-mot-de-passe-application-gmail"
EMAIL_FROM="votre.email@gmail.com"

# Configuration 2FA
TWOFA_CODE_EXPIRY_MINUTES="5"
TWOFA_MAX_ATTEMPTS="3"

# URL de l'application
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-nextauth-different"
```

### 4. Configuration Gmail (Recommandée)

Pour utiliser Gmail comme service SMTP :

1. **Activez l'authentification à 2 facteurs** sur votre compte Gmail
2. **Générez un mot de passe d'application** :
   - Allez dans Paramètres Google → Sécurité
   - Cliquez sur "Mots de passe d'application"
   - Sélectionnez "Autre" et nommez-le "Next.js Auth Demo"
   - Utilisez le mot de passe généré dans `EMAIL_PASS`

### 5. Initialiser la Base de Données

```bash
# Générer le client Prisma
npm run db:generate

# Pousser le schéma vers la base de données
npm run db:push
```

### 6. Lancer l'Application

```bash
# Mode développement
npm run dev

# L'application sera disponible sur http://localhost:3000
```

## 📖 Guide d'Utilisation

### 1. Page d'Accueil
- Visitez `http://localhost:3000`
- Découvrez les fonctionnalités du système
- Cliquez sur "Se connecter" ou "Créer un compte"

### 2. Inscription
- Remplissez le formulaire d'inscription
- Utilisez un email valide (vous recevrez l'email de bienvenue)
- Créez un mot de passe fort (indicateur de force inclus)
- Acceptez les conditions d'utilisation

### 3. Connexion avec 2FA
- Entrez votre email et mot de passe
- Un code à 6 chiffres sera envoyé à votre email
- Entrez le code dans l'interface (saisie automatique)
- Accédez au dashboard sécurisé

### 4. Dashboard
- Consultez vos informations de profil
- Vérifiez le statut de sécurité de votre compte
- Gérez vos sessions actives
- Explorez les statistiques de sécurité

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev          # Lancer en mode dev
npm run build        # Build de production
npm run start        # Lancer en production
npm run lint         # Linter le code

# Base de données
npm run db:push      # Pousser le schéma
npm run db:studio    # Interface Prisma Studio
npm run db:generate  # Générer le client
```

## 🛡️ Sécurité

### Mesures de Sécurité Implémentées

- **🔐 Authentification forte** : 2FA obligatoire pour tous les comptes
- **🔑 Hashage sécurisé** : bcrypt avec salt pour les mots de passe
- **🛡️ Protection CSRF** : Tokens anti-falsification de requête
- **⚡ Rate Limiting** : Protection contre les attaques par force brute
- **🚫 Validation stricte** : Zod pour valider toutes les entrées
- **📊 Audit complet** : Journalisation de toutes les actions de sécurité
- **🔍 Détection d'anomalies** : Monitoring des activités suspectes
- **🛠️ Headers sécurisés** : CSP, HSTS, X-Frame-Options, etc.
- **🔒 Sessions sécurisées** : JWT avec refresh tokens et fingerprinting

### Bonnes Pratiques Suivies

- Principe du moindre privilège
- Défense en profondeur
- Séparation des préoccupations
- Validation côté client ET serveur
- Logs de sécurité détaillés
- Gestion d'erreurs sécurisée
- Nettoyage automatique des données expirées

## 📚 Documentation API

### Endpoints d'Authentification

#### `POST /api/auth/register`
Inscription d'un nouvel utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "MotDePasse123!",
  "name": "Jean Dupont"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Compte créé avec succès",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "Jean Dupont"
  }
}
```

#### `POST /api/auth/login`
Connexion avec envoi du code 2FA.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "MotDePasse123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Code de vérification envoyé",
  "requires2FA": true
}
```

#### `POST /api/2fa/verify-code`
Vérification du code 2FA et authentification complète.

**Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentification réussie",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "Jean Dupont"
  },
  "token": "jwt_access_token"
}
```

#### `POST /api/auth/logout`
Déconnexion et invalidation de session.

#### `GET /api/auth/me`
Récupération du profil utilisateur (authentification requise).

#### `POST /api/auth/refresh`
Rafraîchissement du token d'accès.

### Endpoints de Sécurité

#### `GET /api/security/sessions`
Liste des sessions actives de l'utilisateur.

#### `DELETE /api/security/sessions`
Terminer une session spécifique.

### Codes de Statut HTTP

- `200` - Succès
- `201` - Créé avec succès
- `400` - Requête invalide
- `401` - Non authentifié
- `403` - Accès interdit
- `404` - Ressource non trouvée
- `409` - Conflit (utilisateur existe déjà)
- `422` - Erreur de validation
- `429` - Trop de requêtes (rate limit)
- `500` - Erreur interne du serveur

## 🚀 Déploiement

### Déploiement sur Vercel (Recommandé)

1. **Fork le repository** sur votre compte GitHub

2. **Connectez-vous à Vercel** et importez le projet

3. **Configurez les variables d'environnement** dans Vercel :
   - Ajoutez toutes les variables de `.env.example`
   - Générez des secrets sécurisés pour la production
   - Utilisez une base de données PostgreSQL (Vercel Postgres)

4. **Déployez automatiquement**

### Configuration Production

**Variables d'environnement production :**
```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@host:port/database"

# Secrets JWT forts (64+ caractères)
JWT_SECRET="votre-secret-production-super-long-et-securise"
JWT_REFRESH_SECRET="votre-refresh-secret-production-different"

# Email production (SendGrid, Mailgun, etc.)
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT="587"
EMAIL_USER="apikey"
EMAIL_PASS="votre-api-key-sendgrid"

# URL de production
NEXTAUTH_URL="https://votre-domaine.vercel.app"
```

### Déploiement Manuel

```bash
# Build de production
npm run build

# Lancer en production
npm run start
```

## 🧪 Tests et Qualité

### Tests Manuels

1. **Test d'inscription**
   - Testez avec différents formats d'email
   - Vérifiez la validation du mot de passe
   - Confirmez la réception de l'email de bienvenue

2. **Test de connexion 2FA**
   - Testez avec des codes valides/invalides
   - Vérifiez l'expiration des codes
   - Testez les tentatives multiples

3. **Test de sécurité**
   - Tentez d'accéder aux routes protégées sans authentification
   - Testez le rate limiting
   - Vérifiez les logs d'audit

### Monitoring et Logs

- Les logs d'audit sont stockés dans la table `audit_logs`
- Les événements de sécurité sont enregistrés automatiquement
- Consultez la console pour les erreurs de développement

## 🤝 Contribution

### Comment Contribuer

1. **Fork** le repository
2. **Créez** une branche feature (`git checkout -b feature/AmazingFeature`)
3. **Committez** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrez** une Pull Request

### Guidelines

- Suivez les conventions TypeScript
- Ajoutez des tests pour les nouvelles fonctionnalités
- Documentez les changements d'API
- Respectez les standards de sécurité

## 📋 Roadmap

### Fonctionnalités Futures

- [ ] **Authentification sociale** (Google, GitHub)
- [ ] **2FA par SMS** en plus de l'email
- [ ] **Récupération de mot de passe** avec 2FA
- [ ] **Authentification biométrique** (WebAuthn)
- [ ] **Dashboard administrateur**
- [ ] **API GraphQL** en plus de REST
- [ ] **Tests automatisés** (Jest, Cypress)
- [ ] **Monitoring avancé** (Sentry, Analytics)
- [ ] **Cache Redis** pour les sessions
- [ ] **Notifications en temps réel**

## 🐛 Dépannage

### Problèmes Courants

**❌ Erreur d'envoi d'email**
```
Solution: Vérifiez vos credentials Gmail et assurez-vous d'utiliser un mot de passe d'application.
```

**❌ Erreur de base de données**
```bash
# Réinitialisez la base de données
rm prisma/dev.db
npm run db:push
```

**❌ Erreur de JWT**
```
Solution: Vérifiez que JWT_SECRET est défini et fait au moins 32 caractères.
```

**❌ Problème de CORS**
```
Solution: Vérifiez NEXTAUTH_URL dans votre fichier .env.local
```

### Support

Pour obtenir de l'aide :

1. Consultez la [documentation](README.md)
2. Vérifiez les [issues existantes](https://github.com/creach-t/nextjs-auth-2fa-demo/issues)
3. Ouvrez une nouvelle issue si nécessaire

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **Next.js** team pour le framework excellent
- **Prisma** pour l'ORM moderne
- **Tailwind CSS** pour le framework CSS
- **Vercel** pour l'hébergement gratuit
- **Communauté open source** pour l'inspiration

## 📞 Contact

**Développeur :** CREACH-T  
**Email :** [Ouvrir une issue](https://github.com/creach-t/nextjs-auth-2fa-demo/issues)  
**GitHub :** [@creach-t](https://github.com/creach-t)

---

**⭐ Si ce projet vous a aidé, n'hésitez pas à lui donner une étoile sur GitHub !**

**🔗 [Démo en ligne](https://nextjs-auth-2fa-demo.vercel.app)** (bientôt disponible)

---

*Développé avec ❤️ en utilisant Next.js, TypeScript et les meilleures pratiques de sécurité moderne.*