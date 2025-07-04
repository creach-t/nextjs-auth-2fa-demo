# 🤝 Guide de Contribution

Merci de votre intérêt pour contribuer à **Next.js Auth 2FA Demo** ! Ce guide vous aidera à comprendre comment participer efficacement au développement du projet.

## 📋 Table des Matières

- [Code de Conduite](#code-de-conduite)
- [Comment Contribuer](#comment-contribuer)
- [Standards de Développement](#standards-de-développement)
- [Process de Review](#process-de-review)
- [Types de Contributions](#types-de-contributions)
- [Rapporter des Bugs](#rapporter-des-bugs)
- [Suggérer des Fonctionnalités](#suggérer-des-fonctionnalités)

## 📜 Code de Conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite :

### Nos Standards

**Comportements encouragés :**
- Utiliser un langage accueillant et inclusif
- Respecter les différents points de vue et expériences
- Accepter gracieusement les critiques constructives
- Se concentrer sur ce qui est le mieux pour la communauté
- Faire preuve d'empathie envers les autres membres

**Comportements inacceptables :**
- Langage ou imagerie sexualisée
- Commentaires insultants ou désobligeants
- Harcèlement public ou privé
- Publication d'informations privées sans permission
- Autre conduite inappropriée dans un contexte professionnel

## 🚀 Comment Contribuer

### 1. Setup de Développement

```bash
# Fork et clone le repository
git clone https://github.com/votre-username/nextjs-auth-2fa-demo.git
cd nextjs-auth-2fa-demo

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env.local

# Configurer la base de données
npm run db:push

# Lancer en mode développement
npm run dev
```

### 2. Créer une Branche

```bash
# Créer une branche depuis main
git checkout -b feature/nom-de-votre-feature

# Ou pour un bugfix
git checkout -b fix/description-du-bug
```

### 3. Faire vos Changements

- Écrivez du code propre et documenté
- Suivez les conventions TypeScript
- Respectez les standards de sécurité
- Testez vos changements manuellement

### 4. Committer vos Changements

```bash
# Ajouter les fichiers modifiés
git add .

# Committer avec un message descriptif
git commit -m "feat: ajouter fonctionnalité X"

# Pousser vers votre fork
git push origin feature/nom-de-votre-feature
```

### 5. Créer une Pull Request

1. Allez sur le repository original
2. Cliquez sur "New Pull Request"
3. Sélectionnez votre branche
4. Remplissez le template de PR
5. Soumettez votre PR

## 🎯 Standards de Développement

### Conventions de Code

**TypeScript :**
```typescript
// ✅ Bon
interface UserProfile {
  id: string
  email: string
  name?: string
}

const getUserProfile = async (userId: string): Promise<UserProfile> => {
  // Implementation
}

// ❌ Éviter
const getUser = (id) => {
  // Pas de types
}
```

**React Components :**
```tsx
// ✅ Bon - Functional component avec types
interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={cn('btn', `btn-${variant}`)}
    >
      {children}
    </button>
  )
}
```

### Conventions de Nommage

- **Fichiers :** `kebab-case.ts`
- **Composants :** `PascalCase.tsx`
- **Variables :** `camelCase`
- **Constantes :** `SCREAMING_SNAKE_CASE`
- **Types/Interfaces :** `PascalCase`

### Structure des Commits

Utilisez [Conventional Commits](https://www.conventionalcommits.org/) :

```
type(scope): description

type: feat, fix, docs, style, refactor, test, chore
scope: auth, ui, api, security (optionnel)
description: description courte en français
```

**Exemples :**
```bash
git commit -m "feat(auth): ajouter validation de mot de passe forte"
git commit -m "fix(ui): corriger l'alignement du formulaire de connexion"
git commit -m "docs: mettre à jour le README avec les nouvelles API"
git commit -m "refactor(security): améliorer la gestion des sessions"
```

### Standards de Sécurité

**À TOUJOURS faire :**
- Valider toutes les entrées utilisateur
- Utiliser les types TypeScript stricts
- Hasher les mots de passe avec bcrypt
- Implémenter le rate limiting
- Logger les événements de sécurité
- Utiliser HTTPS en production

**À JAMAIS faire :**
- Exposer des secrets dans le code
- Faire confiance aux données côté client
- Ignorer les erreurs de validation
- Utiliser des algorithmes de hash faibles
- Stocker des mots de passe en plain text

## 🔍 Process de Review

### Checklist pour les PRs

**Avant de soumettre :**
- [ ] Le code compile sans erreurs
- [ ] Les tests manuels passent
- [ ] La documentation est mise à jour si nécessaire
- [ ] Les messages de commit suivent les conventions
- [ ] Aucun secret n'est exposé
- [ ] Les standards de sécurité sont respectés

**Template de PR :**
```markdown
## Description
Brève description des changements apportés.

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Tests effectués
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Tests manuels

## Checklist
- [ ] Code auto-documenté et commenté
- [ ] Documentation mise à jour
- [ ] Aucun warning de build
- [ ] Standards de sécurité respectés
```

### Critères d'Acceptation

1. **Qualité du Code :** Clean, lisible, maintenable
2. **Sécurité :** Aucune vulnérabilité introduite
3. **Performance :** Pas de régression de performance
4. **Compatibilité :** Fonctionne avec la stack existante
5. **Documentation :** Changements documentés

## 📝 Types de Contributions

### 🐛 Bug Fixes
- Corriger des dysfonctionnements
- Améliorer la gestion d'erreurs
- Résoudre des problèmes de sécurité

### ✨ Nouvelles Fonctionnalités
- Authentification sociale
- 2FA par SMS
- Dashboard admin
- API GraphQL

### 📚 Documentation
- Améliorer le README
- Ajouter des exemples de code
- Documenter les APIs
- Traduire la documentation

### 🎨 Améliorations UI/UX
- Améliorer le design
- Optimiser l'accessibilité
- Ajouter des animations
- Responsive design

### 🔧 Refactoring
- Améliorer la structure du code
- Optimiser les performances
- Réduire la complexité
- Moderniser les dépendances

## 🐛 Rapporter des Bugs

### Template d'Issue Bug

```markdown
**Titre :** [Bug] Description courte du problème

**Description du bug**
Description claire et concise du bug.

**Étapes pour reproduire**
1. Aller à '...'
2. Cliquer sur '...'
3. Voir l'erreur

**Comportement attendu**
Description du comportement attendu.

**Captures d'écran**
Si applicable, ajouter des captures d'écran.

**Environnement**
- OS: [ex. Windows 10]
- Navigateur: [ex. Chrome 91]
- Version Node: [ex. 18.17.0]

**Informations supplémentaires**
Contexte additionnel sur le problème.
```

### Priorités des Bugs

- 🔴 **Critique :** Vulnérabilité de sécurité, app cassée
- 🟠 **Élevée :** Fonctionnalité majeure cassée
- 🟡 **Moyenne :** Fonctionnalité mineure cassée
- 🟢 **Faible :** Problème cosmétique

## 💡 Suggérer des Fonctionnalités

### Template d'Issue Feature

```markdown
**Titre :** [Feature] Nom de la fonctionnalité

**Problème à résoudre**
Description du problème que cette fonctionnalité résoudrait.

**Solution proposée**
Description claire de la fonctionnalité souhaitée.

**Alternatives considérées**
Autres solutions ou fonctionnalités considérées.

**Contexte additionnel**
Informations supplémentaires, maquettes, etc.
```

### Processus d'Évaluation

1. **Discussion :** La fonctionnalité est discutée dans l'issue
2. **Évaluation :** Impact, complexité, alignement avec la vision
3. **Décision :** Acceptée, rejetée, ou besoin de plus d'informations
4. **Développement :** Si acceptée, développement par la communauté

## 🏷️ Labels du Projet

- `good first issue` - Bon pour les nouveaux contributeurs
- `help wanted` - Aide externe souhaitée
- `bug` - Quelque chose ne fonctionne pas
- `enhancement` - Nouvelle fonctionnalité ou amélioration
- `documentation` - Amélioration de la documentation
- `security` - Lié à la sécurité
- `priority: high` - Priorité élevée
- `wontfix` - Ne sera pas corrigé

## 🎉 Reconnaissance

Tous les contributeurs seront :
- Ajoutés au fichier CONTRIBUTORS.md
- Mentionnés dans les release notes
- Remerciés sur les réseaux sociaux

## 📞 Besoin d'Aide ?

- 💬 **Discussions :** [GitHub Discussions](https://github.com/creach-t/nextjs-auth-2fa-demo/discussions)
- 🐛 **Bugs :** [GitHub Issues](https://github.com/creach-t/nextjs-auth-2fa-demo/issues)
- 📧 **Contact :** Ouvrir une issue pour toute question

---

**Merci de contribuer à rendre ce projet encore meilleur ! 🙏**