export const BASE = 'fixa';

export const TABLES = {
  categories: 'categories',
  profils: 'profils',
  fournisseurs: 'fournisseurs',
  services: 'services',
  disponibilites: 'disponibilites',
  conges: 'conges',
  creneauxOccupes: 'creneaux_occupes',
  rendezVous: 'rendez_vous',
  avis: 'avis',
  transitions: 'transitions',
} as const;

export const BUCKET = 'fichiers';

export const FONCTIONS = { api: 'api', worker: 'worker' } as const;

export const LABELS = { admin: 'admin', client: 'client', fournisseur: 'fournisseur' } as const;

// Public by design: every app build carries the endpoint and the project id.
export const APPWRITE = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projet: '6afcb6080038462afb76',
  plateforme: 'me.sectiontn.fixa',
} as const;
