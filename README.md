# Sanitrace — app HACCP cuisine professionnelle

## Démarrage local

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000)

- Terrain : code **2580** (opérateur) ou **1470** (responsable)
- Back-office : `/backoffice`

Le SQLite local (`prisma/dev.db`) sert la Phase 0/1. Les migrations Postgres + RLS sont dans `supabase/migrations/` pour le branchement Supabase.
