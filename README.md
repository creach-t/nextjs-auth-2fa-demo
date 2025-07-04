# Next.js Auth 2FA Demo

Démonstration complète d'un système d'authentification Next.js avec authentification à deux facteurs (A2F) par email.

## 🚀 Fonctionnalités

### Authentification Core
- ✅ Connexion et inscription sécurisées
- ✅ Gestion des sessions avec JWT
- ✅ Logout fonctionnel
- ✅ Validation côté client et serveur

### Authentification à Deux Facteurs (A2F)
- ✅ Génération de codes à 6 chiffres
- ✅ Envoi par email avec Nodemailer
- ✅ Validation avec expiration (5 minutes)
- ✅ Protection contre les tentatives multiples

### Sécurité
- ✅ Hashage des mots de passe avec bcrypt
- ✅ Validation avec Zod
- ✅ Protection CSRF
- ✅ Rate limiting

### Interface Utilisateur
- ✅ Design moderne avec Tailwind CSS
- ✅ Responsive design
- ✅ Support mode sombre
- ✅ Animations et transitions
- ✅ Accessibilité (a11y)

## 🛠️ Stack Technique

- **Framework**: Next.js 14 avec App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Base de données**: SQLite avec Prisma
- **Authentification**: JWT custom
- **Email**: Nodemailer
- **Validation**: Zod
- **Formulaires**: React Hook Form
- **Icons**: Lucide React

## 📦 Installation

1. Cloner le repository
```bash
git clone https://github.com/creach-t/nextjs-auth-2fa-demo.git
cd nextjs-auth-2fa-demo
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env.local
```

4. Configurer la base de données
```bash
npm run db:push
```

5. Lancer le serveur de développement
```bash
npm run dev
```

## 🔧 Configuration

### Variables d'environnement

Copiez `.env.example` vers `.env.local` et configurez:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="your-email@gmail.com"

# 2FA Configuration
TWOFA_CODE_EXPIRY_MINUTES="5"
TWOFA_MAX_ATTEMPTS="3"
```

### Configuration Email

Pour Gmail, vous devez:
1. Activer l'authentification à deux facteurs
2. Générer un mot de passe d'application
3. Utiliser ce mot de passe dans `EMAIL_PASS`

## 📁 Structure du Projet

```
src/
├── app/                    # App Router Next.js
│   ├── (auth)/            # Routes d'authentification
│   ├── dashboard/         # Zone protégée
│   ├── api/               # Routes API
│   └── globals.css        # Styles globaux
├── components/
│   ├── ui/                # Composants UI réutilisables
│   ├── auth/              # Composants d'authentification
│   └── forms/             # Composants de formulaires
├── lib/
│   ├── auth.js            # Logique d'authentification
│   ├── db.js              # Configuration base de données
│   ├── email.js           # Service d'email
│   ├── utils.js           # Utilitaires
│   └── validations.js     # Schémas de validation
└── types/                 # Types TypeScript
```

## 🔒 Sécurité

### Mesures Implémentées

- **Hashage des mots de passe**: bcrypt avec salt
- **JWT sécurisés**: Tokens avec expiration
- **Validation stricte**: Zod pour tous les inputs
- **Rate limiting**: Protection contre le brute force
- **Codes 2FA sécurisés**: Expiration automatique
- **Protection CSRF**: Tokens de sécurité

### Bonnes Pratiques

- Variables d'environnement pour les secrets
- Validation côté client et serveur
- Messages d'erreur génériques
- Nettoyage automatique des codes expirés

## 🚀 Déploiement

### Vercel (Recommandé)

1. Connecter le repository à Vercel
2. Configurer les variables d'environnement
3. Déployer automatiquement

### Variables d'environnement pour la production

- Générer des secrets JWT forts
- Configurer un service email production
- Utiliser une base de données production (PostgreSQL)

## 📚 Documentation API

### Endpoints d'authentification

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/verify-2fa` - Vérification 2FA
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil utilisateur

### Endpoints 2FA

- `POST /api/2fa/send-code` - Envoyer code 2FA
- `POST /api/2fa/verify-code` - Vérifier code 2FA

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:coverage
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

MIT - Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

Pour toute question ou problème, ouvrez une [issue](https://github.com/creach-t/nextjs-auth-2fa-demo/issues).

---

**Développé avec ❤️ en utilisant Next.js, TypeScript et les meilleures pratiques de sécurité.**