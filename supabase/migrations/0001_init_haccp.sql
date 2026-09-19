-- Schéma Postgres `haccp` — à appliquer sur Supabase (prod).
-- Le développement local utilise Prisma + SQLite (même modèle).

create schema if not exists haccp;

create table if not exists haccp.organisation (
  id text primary key,
  nom text not null,
  siren text,
  created_at timestamptz not null default now()
);

create table if not exists haccp.etablissement (
  id text primary key,
  organisation_id text not null references haccp.organisation(id),
  nom text not null,
  adresse text,
  type_cuisine text not null,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists haccp.utilisateur (
  id text primary key,
  auth_uid uuid unique,
  organisation_id text not null references haccp.organisation(id),
  nom text not null,
  prenom text not null,
  email text,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists haccp.membre_etablissement (
  id text primary key,
  utilisateur_id text not null references haccp.utilisateur(id),
  etablissement_id text not null references haccp.etablissement(id),
  role text not null check (role in ('operateur','responsable','gerant','lecture')),
  actif boolean not null default true,
  unique (utilisateur_id, etablissement_id)
);

create table if not exists haccp.code_operateur (
  id text primary key,
  membre_etablissement_id text not null references haccp.membre_etablissement(id),
  code_hash text not null,
  actif boolean not null default true
);

create table if not exists haccp.equipement (
  id text primary key,
  etablissement_id text not null references haccp.etablissement(id),
  nom text not null,
  type text not null,
  qr_token text not null unique,
  seuil_min double precision,
  seuil_max double precision,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists haccp.point_controle (
  id text primary key,
  etablissement_id text not null references haccp.etablissement(id),
  libelle text not null,
  type text not null,
  seuil_min double precision,
  seuil_max double precision,
  regle_temps text,
  actif boolean not null default true
);

create table if not exists haccp.plan_frequence (
  id text primary key,
  etablissement_id text not null references haccp.etablissement(id),
  cible_type text not null,
  cible_id text not null,
  frequence text not null,
  horaires text not null,
  actif boolean not null default true
);

create table if not exists haccp.releve_temperature (
  id text primary key,
  client_uuid text not null unique,
  etablissement_id text not null references haccp.etablissement(id),
  equipement_id text references haccp.equipement(id),
  point_controle_id text references haccp.point_controle(id),
  valeur double precision not null,
  conforme boolean not null,
  methode text not null,
  code_operateur_id text not null references haccp.code_operateur(id),
  note text,
  photo_url text,
  corrige_par_id text references haccp.releve_temperature(id),
  created_at timestamptz not null default now()
);

create table if not exists haccp.reception (
  id text primary key,
  client_uuid text not null unique,
  etablissement_id text not null references haccp.etablissement(id),
  fournisseur text not null,
  bl_ref text,
  produit text not null,
  lot text,
  dlc text,
  temperature double precision,
  emballage_ok boolean not null,
  estampille_ok boolean not null,
  conforme boolean not null,
  photo_url text,
  code_operateur_id text not null references haccp.code_operateur(id),
  created_at timestamptz not null default now()
);

create table if not exists haccp.lot_produit (
  id text primary key,
  etablissement_id text not null references haccp.etablissement(id),
  type text not null,
  produit text not null,
  lot_source text,
  date_debut timestamptz not null,
  dlc_secondaire timestamptz not null,
  qr_token text not null unique,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists haccp.plat_temoin (
  id text primary key,
  etablissement_id text not null references haccp.etablissement(id),
  plat text not null,
  service_date timestamptz not null,
  code_operateur_id text not null references haccp.code_operateur(id),
  destruction_prevue timestamptz not null,
  detruit_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists haccp.produit_nettoyage (
  id text primary key,
  etablissement_id text not null references haccp.etablissement(id),
  nom text not null,
  dosage text,
  temps_contact text,
  fds_url text,
  dangers text
);

create table if not exists haccp.tache_nettoyage (
  id text primary key,
  etablissement_id text not null references haccp.etablissement(id),
  zone text not null,
  produit_nettoyage_id text references haccp.produit_nettoyage(id),
  frequence text not null,
  methode_tact text not null,
  role_responsable text not null,
  actif boolean not null default true
);

create table if not exists haccp.execution_nettoyage (
  id text primary key,
  client_uuid text not null unique,
  tache_nettoyage_id text not null references haccp.tache_nettoyage(id),
  etablissement_id text not null references haccp.etablissement(id),
  code_operateur_id text not null references haccp.code_operateur(id),
  fait_at timestamptz not null,
  note text,
  photo_url text
);

create table if not exists haccp.checklist (
  id text primary key,
  etablissement_id text not null references haccp.etablissement(id),
  nom text not null,
  type text not null,
  actif boolean not null default true
);

create table if not exists haccp.checklist_item (
  id text primary key,
  checklist_id text not null references haccp.checklist(id) on delete cascade,
  libelle text not null,
  ordre int not null default 0
);

create table if not exists haccp.checklist_execution (
  id text primary key,
  client_uuid text not null unique,
  checklist_id text not null references haccp.checklist(id),
  code_operateur_id text not null references haccp.code_operateur(id),
  items_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists haccp.huile_friture (
  id text primary key,
  etablissement_id text not null references haccp.etablissement(id),
  bac text not null,
  actif boolean not null default true
);

create table if not exists haccp.releve_huile (
  id text primary key,
  client_uuid text not null unique,
  huile_id text not null references haccp.huile_friture(id),
  composes_polaires double precision not null,
  action text not null,
  code_operateur_id text not null references haccp.code_operateur(id),
  created_at timestamptz not null default now()
);

create table if not exists haccp.nuisibles_passage (
  id text primary key,
  etablissement_id text not null references haccp.etablissement(id),
  prestataire text not null,
  date timestamptz not null,
  observations text,
  rapport_url text
);

create table if not exists haccp.formation (
  id text primary key,
  membre_etablissement_id text not null references haccp.membre_etablissement(id),
  type text not null,
  obtenue_le date not null,
  expire_le date,
  attestation_url text
);

create table if not exists haccp.non_conformite (
  id text primary key,
  etablissement_id text not null references haccp.etablissement(id),
  source text not null,
  source_id text,
  constat text not null,
  gravite text not null,
  cause text,
  action_immediate text,
  action_preventive text,
  responsable_id text references haccp.membre_etablissement(id),
  echeance timestamptz,
  statut text not null default 'ouvert',
  preuve_url text,
  cloture_at timestamptz,
  valide_par_id text references haccp.membre_etablissement(id),
  created_at timestamptz not null default now()
);

create table if not exists haccp.document_pms (
  id text primary key,
  etablissement_id text not null references haccp.etablissement(id),
  titre text not null,
  categorie text not null,
  version text not null,
  fichier_url text,
  created_at timestamptz not null default now()
);

create table if not exists haccp.parametre (
  id text primary key,
  organisation_id text not null references haccp.organisation(id),
  cle text not null,
  valeur text not null,
  unique (organisation_id, cle)
);

create table if not exists haccp.audit_log (
  id text primary key,
  etablissement_id text not null references haccp.etablissement(id),
  acteur text not null,
  action text not null,
  cible text not null,
  payload_json jsonb not null,
  created_at timestamptz not null default now()
);
