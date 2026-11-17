export type StatutRendezVous =
  | 'EN_ATTENTE'
  | 'CONFIRME'
  | 'REFUSE'
  | 'EXPIRE'
  | 'ANNULE'
  | 'TERMINE';
export type Role = 'client' | 'fournisseur' | 'admin' | 'systeme';
export type ActionRendezVous = 'accepter' | 'refuser' | 'annuler' | 'terminer' | 'expirer';
export type TypePrix = 'FIXE' | 'A_PARTIR_DE' | 'SUR_DEVIS';
export type Source = 'APP' | 'CHATBOT';
export type AnnulePar = 'client' | 'fournisseur' | 'systeme';
export type StatutVerification = 'EN_ATTENTE' | 'VALIDE' | 'REFUSE';
export type Langue = 'fr' | 'ar' | 'en';
export type JourSemaine = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Acteur {
  id: string;
  role: Role;
}

// jour 1 = lundi, heures 'HH:MM' Tunis.
export interface Disponibilite {
  fournisseurId: string;
  jour: JourSemaine;
  debut: string;
  fin: string;
}

// Dates 'YYYY-MM-DD' Tunis, bornes incluses.
export interface Conge {
  fournisseurId: string;
  debut: string;
  fin: string;
  motif?: string;
}

interface Ligne {
  $id: string;
}

export interface RendezVous extends Ligne {
  clientId: string;
  fournisseurId: string;
  serviceId: string;
  serviceTitre: string;
  typePrix: TypePrix;
  prix: number | null;
  duree: number;
  debut: string;
  adresse: string;
  description: string;
  estUrgent: boolean;
  source: Source;
  statut: StatutRendezVous;
  dateLimiteReponse: string;
  motif: string | null;
  annulePar: AnnulePar | null;
  annulationTardive: boolean;
  clientNom: string;
  clientTelephone: string;
  fournisseurNom: string;
  aAvis: boolean;
  dernierStatutNotifie: StatutRendezVous | null;
}

export interface Fournisseur extends Ligne {
  nom: string;
  categorieId: string;
  ville: string;
  latitude: number;
  longitude: number;
  prixMin: number | null;
  statutVerification: StatutVerification;
  noteMoyenne: number;
  nbAvis: number;
  visible: boolean;
  finEssai: string | null;
  finAbonnement: string | null;
  motifRefus: string | null;
}

export interface Service extends Ligne {
  fournisseurId: string;
  titre: string;
  description: string;
  typePrix: TypePrix;
  prix: number | null;
  duree: number;
  estVisible: boolean;
}

export interface Avis extends Ligne {
  rendezVousId: string;
  fournisseurId: string;
  clientId: string;
  clientNom: string;
  serviceTitre: string;
  note: 1 | 2 | 3 | 4 | 5;
  criteres: string[];
  commentaire: string;
}

export interface Profil extends Ligne {
  prenom: string;
  nom: string;
  telephone: string;
  langue: Langue;
  ville: string;
  specialites: string[];
  description: string;
  adresse: string;
  latitude: number | null;
  longitude: number | null;
}

// cellule is the exact toISOString of a 30-minute cell start, the unique index compares it as text.
export interface CreneauOccupe extends Ligne {
  fournisseurId: string;
  cellule: string;
  rendezVousId: string;
}

// One row per status a booking leaves, id `${rendezVousId}.${de}`, so two concurrent changes cannot both win.
export interface Transition extends Ligne {
  rendezVousId: string;
  de: StatutRendezVous;
  vers: StatutRendezVous;
  par: Role;
}

export interface Categorie extends Ligne {
  nom: string;
  icone: string;
  couleur: string;
  ordre: number;
  estActive: boolean;
}
