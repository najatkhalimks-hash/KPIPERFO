# Guide d'installation — GSMI Researcher Platform

## Prérequis

- Node.js 18+ et npm 9+
- Compte [Supabase](https://supabase.com) (gratuit)
- Compte [Vercel](https://vercel.com) (gratuit)
- Compte [GitHub](https://github.com)

---

## Étape 1 — Configuration Supabase

### 1.1 Créer un projet

1. Connectez-vous sur [supabase.com](https://supabase.com)
2. Cliquez **New Project**
3. Nommez le projet : `gsmi-researcher-platform`
4. Choisissez une région proche (Europe West)
5. Définissez un mot de passe de base de données fort
6. Cliquez **Create new project** et attendez ~2 minutes

### 1.2 Récupérer les clés API

Dans votre projet Supabase :
1. Allez dans **Settings → API**
2. Copiez :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

### 1.3 Exécuter les migrations SQL

1. Dans Supabase, allez dans **SQL Editor**
2. Cliquez **New query**
3. Copiez-collez le contenu de `supabase/migrations/001_initial_schema.sql`
4. Cliquez **Run** (vérifiez qu'il n'y a pas d'erreurs)
5. Répétez avec `supabase/migrations/002_seed_data.sql`

### 1.4 Configurer l'authentification

1. Allez dans **Authentication → Settings**
2. Sous **Email Auth** : activez **Enable email confirmations** (optionnel pour usage interne)
3. Configurez **Site URL** : `http://localhost:5173` (développement) ou votre URL Vercel (production)
4. Ajoutez les **Redirect URLs** : `http://localhost:5173/**` et `https://votre-app.vercel.app/**`

### 1.5 Configurer le Storage (optionnel)

1. Allez dans **Storage**
2. Cliquez **Create bucket**
3. Nom : `researcher-docs`
4. **Public bucket** : NON (privé)
5. Cliquez **Save**
6. Dans **SQL Editor**, exécutez les politiques Storage commentées dans `002_seed_data.sql`

---

## Étape 2 — Installation locale

```bash
# Cloner le dépôt
git clone https://github.com/votre-org/gsmi-researcher-platform.git
cd gsmi-researcher-platform

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
```

Éditez `.env.local` :
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...votre_cle_ici
```

```bash
# Lancer le serveur de développement
npm run dev
# → L'application est disponible sur http://localhost:5173
```

---

## Étape 3 — Créer le premier administrateur

1. Ouvrez l'application sur `http://localhost:5173`
2. Cliquez **Créer un compte** et inscrivez-vous
3. Dans Supabase **Table Editor → profiles**
4. Trouvez votre enregistrement et changez `role` de `researcher` à `admin`
5. Rechargez l'application — vous avez maintenant accès au module Administration

---

## Étape 4 — Déploiement sur Vercel

### 4.1 Pousser sur GitHub

```bash
git init
git add .
git commit -m "Initial commit - GSMI Researcher Platform"
git branch -M main
git remote add origin https://github.com/votre-org/gsmi-researcher-platform.git
git push -u origin main
```

### 4.2 Déployer sur Vercel

1. Connectez-vous sur [vercel.com](https://vercel.com)
2. Cliquez **New Project**
3. Importez votre dépôt GitHub `gsmi-researcher-platform`
4. **Framework Preset** : Vite (détecté automatiquement)
5. **Root Directory** : `.` (racine)
6. Ajoutez les **Environment Variables** :
   - `VITE_SUPABASE_URL` = votre URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = votre clé Supabase
7. Cliquez **Deploy**

### 4.3 Mettre à jour les URLs Supabase

Après le déploiement, récupérez votre URL Vercel (ex: `https://gsmi-platform.vercel.app`) :

1. Dans Supabase **Authentication → URL Configuration**
2. Mettez à jour **Site URL** : `https://gsmi-platform.vercel.app`
3. Ajoutez dans **Redirect URLs** : `https://gsmi-platform.vercel.app/**`

---

## Étape 5 — Déploiements ultérieurs

Chaque `git push` sur la branche `main` déclenche automatiquement un redéploiement sur Vercel.

```bash
# Développer et déployer
git add .
git commit -m "feat: ajout d'une fonctionnalité"
git push origin main
# → Vercel redéploie automatiquement en ~1-2 minutes
```

---

## Commandes disponibles

```bash
npm run dev      # Serveur de développement (port 5173)
npm run build    # Build de production
npm run preview  # Prévisualiser le build
npm run lint     # Vérification ESLint
```

---

## Résolution des problèmes courants

### Erreur "Invalid API key"
→ Vérifiez que les variables d'environnement sont correctement définies dans `.env.local`

### Les tables n'existent pas
→ Vérifiez que le fichier `001_initial_schema.sql` a été exécuté sans erreur dans Supabase SQL Editor

### Page blanche après connexion
→ Vérifiez la Redirect URL dans Supabase Authentication Settings

### Erreur CORS
→ Ajoutez votre URL (localhost ou Vercel) dans les Site URLs de Supabase

---

## Support

Pour toute question, consultez :
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation React Query](https://tanstack.com/query)
