# 🍽️ App Contrôle Sanitaire & HACCP — Cuisine Professionnelle

> **Doc de fondation** à ouvrir dans Cursor. Objectif : couvrir **100 %** du Plan de Maîtrise Sanitaire (PMS) numérique — relevés de températures, traçabilité, plan de nettoyage/ménage, non-conformités, plats témoins, huiles, nuisibles, formations — pour un ou plusieurs établissements.
>
> Nom de travail : **`sanitrace`** (à renommer). Version cible : **v1**.

---

## 0. TL;DR (ce qu'on construit)

Une **app terrain + back-office** qui remplace le classeur HACCP papier :

- Le personnel fait ses **relevés en 5 secondes** sur tablette/mobile (souvent hors-ligne), en scannant un **QR code** sur l'équipement.
- Tout est **horodaté, signé (par code), inaltérable** (append-only) → dossier prêt pour un contrôle **DDPP** à tout moment.
- Le gérant a un **dashboard multi-établissement temps réel** : ce qui est fait / en retard, les alertes (frigo hors seuil, tâche de ménage sautée, DLC dépassée), et l'**export PDF** du dossier sanitaire par période.

**Non négociable** : rapide, hors-ligne, traçable, inaltérable.

---

## 1. Cadre réglementaire (la base métier)

> ⚠️ Les seuils et durées ci-dessous sont ceux couramment appliqués en restauration commerciale en France. Ils doivent rester **paramétrables** (jamais codés en dur) et alignés sur le **PMS de l'établissement** et les arrêtés en vigueur. Ne pas présenter l'app comme un conseil juridique.

### 1.1 Textes de référence
- **Paquet Hygiène** : règlements **CE 852/2004** (hygiène des denrées), **853/2004** (produits d'origine animale), **178/2002** (traçabilité, art. 18).
- **Méthode HACCP** (7 principes) : analyse des dangers, points critiques (CCP), seuils critiques, surveillance, actions correctives, vérification, enregistrement.
- **PMS = Plan de Maîtrise Sanitaire** : Bonnes Pratiques d'Hygiène (BPH) + HACCP + traçabilité + gestion des non-conformités + gestion des alertes/retraits.
- **Arrêté du 21 décembre 2009** : températures de conservation, remise en température, **plats témoins**.
- **INCO — règlement UE 1169/2011** : allergènes / étiquetage.
- **Formation hygiène alimentaire** : au moins une personne formée dans l'établissement (restauration commerciale).
- **Contrôles officiels** : DDPP / DDETSPP, dispositif **Alim'confiance** (transparence des résultats).

### 1.2 Seuils de température (valeurs par défaut, paramétrables)
| Point de contrôle | Seuil par défaut |
|---|---|
| Froid positif (denrées très périssables) | ≤ **+3 °C** |
| Froid positif (autres produits réfrigérés) | ≤ **+4 °C** / +8 °C selon produit |
| Congélation / surgelés | ≤ **−18 °C** |
| Réception surgelés (tolérance transport) | ≥ −18 °C (tolérance courte −15 °C) |
| Cuisson à cœur (général) | ≥ **+63 °C** (viande hachée / volaille ≥ +70–74 °C) |
| Refroidissement rapide | de +63 °C à **+10 °C en < 2 h** |
| Maintien / liaison chaude | ≥ **+63 °C** |
| Remise en température | ≥ +63 °C à cœur en **< 1 h** |
| Huile de friture (composés polaires) | ≤ **25 %** |
| Plats témoins | conservés **≥ 5 jours** à ≤ +3 °C, portions ~80–100 g |

### 1.3 Durées de conservation des enregistrements
- Enregistrements HACCP / traçabilité : **conserver au minimum 1 an** (souvent aligné sur DLC + marge). → **archivage inaltérable + export**, jamais de suppression.

---

## 2. Personas & rôles

| Rôle | Ce qu'il fait | Device |
|---|---|---|
| **Opérateur / cuisinier** | Relevés T°, contrôles réception, tâches de ménage, étiquetage, plats témoins, signale une non-conformité | Mobile / tablette (terrain, offline) |
| **Responsable établissement / chef** | Valide les non-conformités et actions correctives, supervise les check-lists ouverture/fermeture, planifie le nettoyage | Tablette / desktop |
| **Gérant / super-admin (toi)** | Vue multi-établissement, paramétrage (équipements, seuils, plannings, produits), exports DDPP, gestion des utilisateurs | Desktop |
| **Auditeur / lecture seule** (comptable, contrôleur externe invité) | Consultation + export, aucun droit d'écriture | Desktop |

> Auth par **code personnel** (rapide, terrain) pour signer un relevé, + compte email/mot de passe (Supabase Auth) pour l'accès back-office. Chaque enregistrement porte l'auteur.

---

## 3. Modules fonctionnels (périmètre v1 = TOUT le PMS)

### M1 — Relevés de températures
- **Équipements** (frigos, congélateurs, chambres froides, vitrines réfrigérées, cellules de refroidissement) : chacun a un **QR code** collé dessus.
- Scan du QR → écran de relevé pré-rempli (équipement, seuil, dernier relevé) → saisie T° → **OK/NOK auto** selon seuil → signature (code).
- **Points de contrôle process** (non liés à un équipement fixe) : cuisson à cœur, refroidissement rapide (2 mesures : départ / +2 h), remise en température, maintien liaison chaude.
- **Fréquences configurables** (ex : frigos 2×/jour matin+soir) + rappels.
- Champ **méthode de mesure** : sonde manuelle / thermomètre équipement / sonde connectée (prévoir l'IoT en v2, ne pas l'implémenter en v1).
- Si NOK → déclenche automatiquement une **non-conformité (M5)**.

### M2 — Contrôles à réception marchandises
- À chaque livraison : fournisseur, **n° de lot / bon de livraison**, T° du produit à réception, **DLC/DLUO**, intégrité emballage, présence **estampille sanitaire**, conformité.
- Photo du BL / de l'étiquette (stockage privé).
- Non-conforme → refus/retour tracé + non-conformité.

### M3 — Traçabilité produits & lots
- **Étiquettes générées par l'app** (imprimables / QR) :
  - **Décongélation** (date + heure + DLC secondaire),
  - **Ouverture / déconditionnement** (DLC secondaire),
  - **Fabrication maison** (produit, date, DLC calculée).
- Registre des **lots** (entrée → transformation → sortie) pour retrait/rappel produit.
- **Plats témoins** : enregistrement (date, plat, service), rappel de destruction à J+5.

### M4 — Plan de nettoyage & désinfection (« le ménage »)
- **Plan paramétrable** : zone/surface/équipement × **fréquence** (par service / quotidien / hebdo / mensuel) × **produit** (avec fiche technique + FDS) × **méthode (TACT)** × **responsable**.
- Vue **planning du jour** : tâches à faire, cochées + signées à l'exécution.
- Tâche en retard → alerte + trace.
- Bibliothèque **produits de nettoyage** (dosage, temps de contact, FDS PDF, dangers).

### M5 — Non-conformités & actions correctives (CAPA)
- Création manuelle **ou** automatique (relevé NOK, réception refusée, ménage sauté).
- Champs : constat, gravité, cause, **action corrective immédiate**, action préventive, responsable, échéance, **preuve (photo)**, statut (ouvert → traité → clôturé), validation responsable.

### M6 — Check-lists ouverture / fermeture & auto-contrôles
- Check-lists configurables (ouverture, fermeture, hebdomadaire) signées.
- Sert de **routine terrain** et de preuve de surveillance.

### M7 — Huiles de friture
- Suivi par bac : contrôle visuel + **% composés polaires** (bandelette/testeur) → alerte si ≥ seuil → vidange tracée.

### M8 — Lutte contre les nuisibles (3D)
- Contrat prestataire, plan des appâts, passages, observations, rapports PDF du prestataire.

### M9 — Formations & habilitations du personnel
- Fiche par salarié : formation hygiène alimentaire (date, attestation PDF), habilitations, **dates d'expiration** → alerte de recyclage.
- (Lien possible avec le scan des pièces déjà fait sur d'autres apps du portfolio — même logique de stockage privé.)

### M10 — Bibliothèque documentaire PMS
- Documents du PMS (diagramme de fabrication, analyse des dangers, protocoles, agréments, analyses d'eau, plans) versionnés et consultables.

### M11 — Rapports, archivage & export DDPP
- **Génération PDF** du dossier sanitaire par établissement / période (tous relevés, ménage, non-conformités, réceptions).
- Archivage inaltérable, prêt à présenter en contrôle.

### M12 — Alertes & notifications
- Temps réel (in-app) + push/email (Resend) : frigo hors seuil, relevé oublié en fin de service, ménage en retard, DLC proche, non-conformité ouverte, formation à renouveler.

---

## 4. Modèle de données (Supabase — schéma `haccp`)

> Multi-établissement (multi-tenant) par `etablissement_id`. **RLS activée sur toutes les tables.** Enregistrements de relevés = **append-only** (pas d'UPDATE/DELETE côté opérateur ; corrections = nouvel enregistrement + lien).

```
organisation
  id, nom, siren

etablissement
  id, organisation_id → organisation, nom, adresse, type_cuisine

utilisateur            -- lié à Supabase Auth (back-office)
  id, auth_uid, organisation_id, nom, prenom, email, actif

membre_etablissement   -- affectation + rôle par établissement
  id, utilisateur_id, etablissement_id, role (operateur|responsable|gerant|lecture)

code_operateur         -- code terrain rapide (hash), rattaché à un membre
  id, membre_etablissement_id, code_hash, actif

equipement             -- frigo, congel, chambre froide, vitrine, cellule...
  id, etablissement_id, nom, type, qr_token (unique), seuil_min, seuil_max, actif

point_controle         -- process : cuisson, refroidissement, liaison chaude...
  id, etablissement_id, libelle, type, seuil_min, seuil_max, regle_temps

plan_frequence         -- planifie relevés / tâches (cron métier)
  id, etablissement_id, cible_type (equipement|point|nettoyage|checklist),
  cible_id, frequence (rrule/simple), horaires, actif

releve_temperature     -- APPEND ONLY
  id, etablissement_id, equipement_id?, point_controle_id?, valeur,
  conforme (bool), methode, code_operateur_id, note, photo_url,
  corrige_par_id?, created_at

reception              -- contrôle marchandises
  id, etablissement_id, fournisseur, bl_ref, produit, lot, dlc,
  temperature, emballage_ok, estampille_ok, conforme, photo_url,
  code_operateur_id, created_at

lot_produit / etiquette
  id, etablissement_id, type (decongelation|ouverture|fabrication),
  produit, lot_source?, date_debut, dlc_secondaire, qr_token, created_by

plat_temoin
  id, etablissement_id, plat, service_date, code_operateur_id,
  destruction_prevue (J+5), detruit_at?

produit_nettoyage
  id, etablissement_id, nom, dosage, temps_contact, fds_url, dangers

tache_nettoyage        -- définition (zone × fréquence × produit × responsable)
  id, etablissement_id, zone, produit_nettoyage_id?, frequence,
  methode_tact, role_responsable, actif

execution_nettoyage    -- APPEND ONLY (tâche cochée)
  id, tache_nettoyage_id, etablissement_id, code_operateur_id,
  fait_at, note, photo_url

checklist / checklist_item / checklist_execution
  (ouverture / fermeture / hebdo, signées)

huile_friture / releve_huile
  bac, composes_polaires, action (ok|vidange), code_operateur_id, created_at

nuisibles_passage
  id, etablissement_id, prestataire, date, observations, rapport_url

formation
  id, membre_etablissement_id, type, obtenue_le, expire_le, attestation_url

non_conformite         -- CAPA
  id, etablissement_id, source (releve|reception|nettoyage|manuel),
  source_id?, constat, gravite, cause, action_immediate, action_preventive,
  responsable_id, echeance, statut, preuve_url, cloture_at, valide_par_id

document_pms
  id, etablissement_id, titre, categorie, version, fichier_url

parametre              -- source unique (seuils par défaut, réglages)
  id, organisation_id, cle, valeur

audit_log              -- journal inaltérable de toutes les écritures sensibles
  id, etablissement_id, acteur, action, cible, payload_json, created_at
```

**Storage** : buckets privés (`receptions`, `preuves-nc`, `fds`, `attestations`, `rapports`) — accès via RLS + URL signées.

**RLS (principe)** : un membre ne voit/écrit que sur les `etablissement_id` où il est affecté ; `gerant` voit toute l'`organisation` ; `lecture` = SELECT only. Les tables `releve_*` et `execution_*` : INSERT autorisé, **UPDATE/DELETE refusés** (corrections via nouvel enregistrement).

---

## 5. Architecture technique

- **Front** : Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui.
- **PWA installable** (icône home tablette) — l'écran terrain est une PWA mobile-first.
- **Offline-first** (exigence forte) :
  - lecture des référentiels (équipements, tâches, seuils) en cache local (IndexedDB),
  - **file de synchro** : les relevés faits hors-ligne sont mis en queue puis rejoués à la reconnexion (idempotence via `client_uuid`),
  - indicateur clair « en attente de synchro » / « synchronisé ».
- **Back** : Supabase (Postgres + Auth + Storage + RLS) ; logique métier sensible (calcul DLC secondaire, conformité, génération dossier) en **Edge Functions** / Server Actions.
- **Prisma** pour le schéma applicatif côté Next (aligné sur le schéma Supabase).
- **Rappels / cron** : planification des relevés et détection des « oublis » via Supabase scheduled functions (ou cron Vercel) → génère alertes.
- **Notifications** : in-app + email/push via **Resend**.
- **PDF** : génération serveur du dossier sanitaire (React-PDF / Puppeteer selon volume).
- **QR** : chaque équipement / étiquette porte un `qr_token` opaque → deep-link vers l'écran de relevé/consultation.
- **Déploiement** : Vercel (front) + Supabase managé. (VPS Coolify/Hetzner possible plus tard, cf. stratégie portfolio.)

### Règles d'ingénierie (héritées du portfolio)
- Aucune donnée NAP / seuil / prix **codée en dur** → tout vient de `parametre` / DB.
- Contenu critique **rendu côté serveur** quand il doit l'être ; pas de logique de conformité côté client seul (le client affiche, le serveur fait foi).
- Sécurité : **audit RLS systématique** avant prod (pas de table sensible avec RLS désactivée).

---

## 6. Écrans (v1)

**Terrain (mobile/tablette, offline)**
1. Accueil opérateur → « Mes tâches du jour » (relevés dus, ménage dû, check-lists) avec compteur retard.
2. Scan QR → relevé T° (1 champ, gros boutons, OK/NOK instantané).
3. Réception marchandise (formulaire court + photo).
4. Ménage → planning du jour, coche + signe.
5. Étiquette (décongélation / ouverture) → impression / QR.
6. Signaler une non-conformité (photo + constat).

**Back-office (desktop)**
7. Dashboard multi-établissement (fait / en retard / alertes, temps réel).
8. Non-conformités (kanban ouvert → traité → clôturé).
9. Paramétrage : établissements, équipements + QR, seuils, plans de fréquence, tâches de ménage, produits, utilisateurs & codes.
10. Documentaire PMS + formations (avec alertes d'expiration).
11. Exports & archivage (dossier PDF par période).

---

## 7. Phases de build (pour Cursor)

- **Phase 0 — Setup** : projet Next 14 + Tailwind + shadcn, Supabase (schéma `haccp` + RLS + storage), Prisma, Auth, seed `parametre` (seuils par défaut), rôles.
- **Phase 1 — Cœur terrain** : équipements + QR, **relevés de températures** offline-first + file de synchro, signature par code, OK/NOK auto. *(= la douleur nº1)*
- **Phase 2 — Ménage** : plan de nettoyage, planning du jour, exécutions signées, retards.
- **Phase 3 — Réception & traçabilité** : contrôle réception + photos, étiquettes DLC secondaires, plats témoins.
- **Phase 4 — Non-conformités (CAPA)** + déclenchement auto depuis relevés/ménage/réception.
- **Phase 5 — Dashboard gérant** temps réel multi-établissement + alertes (Resend).
- **Phase 6 — Export DDPP** (PDF) + archivage inaltérable.
- **Phase 7 (backlog)** : huiles, nuisibles, formations/expirations, sondes IoT Bluetooth, Alim'confiance.

---

## 8. Prompt de bootstrap Cursor

> À coller dans Cursor pour démarrer la Phase 0 → 1.

```
Tu construis "sanitrace", une app HACCP pour cuisine professionnelle (multi-établissement).
Stack imposée : Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui + Prisma + Supabase (Auth, Postgres, Storage, RLS) + Vercel + Resend. PWA mobile-first, OFFLINE-FIRST pour les écrans terrain.

Contraintes non négociables :
- Les relevés (releve_temperature, execution_nettoyage, reception) sont APPEND-ONLY : INSERT autorisé, UPDATE/DELETE refusés par RLS. Une correction = nouvel enregistrement lié.
- Aucun seuil ni donnée sensible codé en dur : tout vient de la table `parametre` / DB.
- RLS activée sur TOUTES les tables, cloisonnée par etablissement_id (rôles : operateur, responsable, gerant, lecture).
- Offline : cache des référentiels (IndexedDB) + file de synchro idempotente (client_uuid) rejouée à la reconnexion, avec état "en attente/synchronisé".
- Signature terrain par code opérateur (hashé), rattaché à un membre_etablissement.

Commence par :
1. Créer le schéma Prisma + migrations Supabase du schéma `haccp` (tables listées dans ARCHITECTURE_HACCP_APP.md §4) avec les policies RLS.
2. Seed des paramètres de seuils par défaut (§1.2) dans `parametre`.
3. L'écran terrain "relevé de température par scan QR" : scan → formulaire 1 champ → OK/NOK auto selon seuil → enregistrement offline-first + signature code.
Livre en respectant les phases de §7. Demande-moi validation avant chaque phase.
```

---

## 9. Points ouverts à trancher (toi)

1. **Périmètre établissements v1** : lesquels d'abord (Comptoir des Flancs ? sandwicherie Nice ? un resto pilote) — combien d'établissements au lancement ?
2. **Sondes connectées** : relevés 100 % manuels en v1, ou tu veux prévoir dès maintenant des thermomètres Bluetooth / capteurs frigo (impacte le modèle mais implémentable en v2) ?
3. **Impression étiquettes** : imprimante thermique dédiée (Brother/Zebra) ou QR affiché à l'écran suffit en v1 ?
4. **Restauration commerciale vs collective** : les plats témoins sont surtout obligatoires en collectif — on les met en option activable par établissement ?
5. **Produit interne only** ou tu vises aussi à le **revendre en SaaS** à d'autres cuisines (change le multi-tenant et le pricing) ?
```
