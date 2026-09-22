export type Role = "operateur" | "responsable" | "gerant" | "lecture";

export type SyncStatus = "pending" | "syncing" | "synced" | "error";

export type QueueKind =
  | "releve_temperature"
  | "reception"
  | "execution_nettoyage"
  | "non_conformite"
  | "plat_temoin"
  | "plat_temoin_destruction"
  | "checklist_execution"
  | "lot_produit"
  | "releve_huile";

export type SessionOperateur = {
  etablissementId: string;
  etablissementNom: string;
  organisationId: string;
  membreId: string;
  utilisateurId: string;
  codeOperateurId: string;
  nom: string;
  prenom: string;
  role: Role;
  signedAt: string;
};

export type EquipementRef = {
  id: string;
  nom: string;
  type: string;
  qrToken: string;
  seuilMin: number | null;
  seuilMax: number | null;
  actif: boolean;
  frequence: string;
  horaires: string;
};

export type PointControleRef = {
  id: string;
  libelle: string;
  type: string;
  seuilMin: number | null;
  seuilMax: number | null;
  regleTemps: string | null;
  actif: boolean;
};

export type TacheNettoyageRef = {
  id: string;
  zone: string;
  frequence: string;
  methodeTact: string;
  roleResponsable: string;
  produitNom: string | null;
  produitDosage: string | null;
  produitDangers: string | null;
  actif: boolean;
};

export type HuileRef = {
  id: string;
  bac: string;
  dernierPolaires: number | null;
  dernierAt: string | null;
};

export type PlatTemoinRef = {
  id: string;
  plat: string;
  serviceDate: string;
  destructionPrevue: string;
  detruitAt: string | null;
};

export type ReleveLocal = {
  id: string;
  clientUuid: string;
  etablissementId: string;
  equipementId: string | null;
  pointControleId: string | null;
  valeur: number;
  conforme: boolean;
  methode: string;
  codeOperateurId: string;
  note: string | null;
  createdAt: string;
  syncStatus: SyncStatus;
  auteurNom: string;
};

export type TacheDuJour = {
  id: string;
  kind: "releve" | "process" | "menage" | "checklist";
  titre: string;
  sousTitre: string;
  creneau?: "matin" | "soir";
  statut: "a_faire" | "fait" | "en_retard";
  href: string;
  lastValue?: number | null;
  lastAt?: string | null;
  conforme?: boolean | null;
};

export type QueueItem = {
  id: string;
  kind: QueueKind;
  payload: Record<string, unknown>;
  createdAt: string;
  status: Exclude<SyncStatus, "synced">;
  error?: string;
};

export type BootstrapPayload = {
  organisationId: string;
  etablissement: { id: string; nom: string; adresse: string | null };
  params: Record<string, string>;
  equipements: EquipementRef[];
  pointsControle: PointControleRef[];
  tachesNettoyage: TacheNettoyageRef[];
  checklists: { id: string; nom: string; type: string; items: { id: string; libelle: string; ordre: number }[] }[];
  relevesRecents: ReleveLocal[];
  executionsNettoyage: { tacheNettoyageId: string; faitAt: string }[];
  checklistExecutions: { checklistId: string; createdAt: string; codeOperateurId?: string }[];
  platsTemoins: PlatTemoinRef[];
  huiles: HuileRef[];
  nonConformitesOuvertes: number;
};
