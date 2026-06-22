# 🔬 GSMI Researcher Platform — Carnet du Chercheur

Plateforme institutionnelle centralisée de gestion des activités de recherche pour **UM6P / GSMI**.

[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-green)](https://supabase.com)
[![React](https://img.shields.io/badge/Frontend-React+TS-blue)](https://react.dev)

---

## 🏗️ Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | TailwindCSS + palette UM6P |
| État | Zustand + React Query |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| i18n | i18next (FR/EN) |
| Déploiement | Vercel |

---

## 📦 Modules fonctionnels

- 📊 **Dashboard** — KPIs automatisés, graphiques, filtres par année
- 📄 **Publications** — Articles, livres, conférences avec fetch DOI via Crossref
- 🔬 **Projets** — Suivi budgétaire, statuts, équipes
- 📚 **Formation** — Heures prévisionnelles/réalisées par semestre et type
- 🎓 **Encadrement** — Doctorants, masters, PFE, stages, postdocs
- 🎤 **Communications** — Conférences, séminaires, médias, vulgarisation
- 🛡️ **Propriété Intellectuelle** — Brevets, marques, logiciels
- 💼 **Prestations** — Expertises, contrats industriels, revenus
- 🤝 **Collaborations** — Partenariats nationaux et internationaux
- ⭐ **Expertise** — Jurys, peer-review, comités scientifiques
- 📈 **Prévisions** — Suivi KPI planifié vs réalisé avec écarts
- 👤 **Profil** — Identifiants académiques, ORCID, Google Scholar
- ⚙️ **Administration** — Gestion utilisateurs, statistiques globales

---

## 🚀 Installation rapide

Voir [`docs/INSTALLATION.md`](docs/INSTALLATION.md) pour les instructions complètes.

```bash
# 1. Cloner le projet
git clone https://github.com/votre-org/gsmi-researcher-platform.git
cd gsmi-researcher-platform

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# → Remplir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 4. Initialiser la base de données
# → Exécuter supabase/migrations/001_initial_schema.sql dans Supabase SQL Editor
# → Exécuter supabase/migrations/002_seed_data.sql

# 5. Lancer en développement
npm run dev
```

---

## 📁 Structure du projet

```
gsmi-researcher-platform/
├── src/
│   ├── components/        # Composants réutilisables
│   │   ├── dashboard/     # Graphiques et KPI cards
│   │   ├── layout/        # AppLayout, Sidebar, Header
│   │   ├── modules/       # Modales de saisie (Publications, Projets...)
│   │   └── ui/            # Boutons, badges, exports
│   ├── hooks/             # useAuth, hooks personnalisés
│   ├── i18n/              # Traductions FR/EN
│   ├── lib/               # Client Supabase
│   ├── pages/             # Pages de l'application
│   ├── store/             # Zustand stores
│   └── types/             # TypeScript types
├── supabase/
│   └── migrations/        # Scripts SQL
├── docs/                  # Documentation
├── vercel.json            # Config Vercel
└── .env.example           # Variables d'environnement
```

---

## 🔐 Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| `researcher` | Ses propres données uniquement |
| `admin` | Toutes les données + gestion utilisateurs |
| `viewer` | Lecture seule (toutes les données) |

---

## 📄 Licence

Usage institutionnel interne — UM6P / GSMI © 2024
