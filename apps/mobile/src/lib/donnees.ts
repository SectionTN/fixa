import {
  ajouterJours,
  type Categorie,
  dateLocale,
  donneesCreneaux,
  type FournisseurAffiche,
  getProfil,
  JOURS_RECHERCHE,
  listerCategories,
  listerServices,
  type Position,
  type Profil,
  preparerFournisseurs,
  rechercherFournisseurs,
  specialitesDe,
  versUtc,
} from '@fixa/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Query } from 'react-native-appwrite';
import { tables } from './appwrite';

export type Lecture<T> = {
  donnees: T | null;
  erreur: boolean;
  chargement: boolean;
  recharger: () => void;
};

type EtatLecture<T> = Omit<Lecture<T>, 'recharger'> & {
  /** The key of the last read started, and the key the data was read for. */
  cle: string | null;
  cleDonnees: string | null;
};

// Reads again when the key or the version changes. A failed refresh keeps what was shown, a failed new key drops it.
export function useLecture<T>(cle: string, lire: () => Promise<T>, version = 0): Lecture<T> {
  const lecteur = useRef(lire);
  lecteur.current = lire;
  const [essai, setEssai] = useState(0);
  const [etat, setEtat] = useState<EtatLecture<T>>({
    cle: null,
    cleDonnees: null,
    donnees: null,
    erreur: false,
    chargement: true,
  });
  useEffect(() => {
    let actif = true;
    setEtat((e) => ({ ...e, cle, erreur: false, chargement: true }));
    lecteur.current().then(
      (donnees) => {
        if (actif) setEtat({ cle, cleDonnees: cle, donnees, erreur: false, chargement: false });
      },
      (e: unknown) => {
        if (__DEV__) console.warn('lecture echouee', cle, e);
        if (!actif) return;
        setEtat((x) =>
          x.cleDonnees === cle
            ? { ...x, erreur: true, chargement: false }
            : { cle, cleDonnees: null, donnees: null, erreur: true, chargement: false },
        );
      },
    );
    return () => {
      actif = false;
    };
  }, [cle, essai, version]);
  const recharger = useCallback(() => setEssai((n) => n + 1), []);
  // Before the effect runs for a new key, the state still describes the previous one.
  const aJour = etat.cle === cle;
  return {
    donnees: etat.donnees,
    erreur: aJour && etat.erreur,
    chargement: !aJour || etat.chargement,
    recharger,
  };
}

// Read once per session of the app, a failure is forgotten so the next screen tries again.
function memoriser<T>(lire: () => Promise<T>): () => Promise<T> {
  let enCours: Promise<T> | null = null;
  return () => {
    enCours ??= lire().catch((e: unknown) => {
      enCours = null;
      throw e;
    });
    return enCours;
  };
}

export const lireCategories = memoriser(() => listerCategories(tables, Query));

const profils = new Map<string, () => Promise<Profil | null>>();

export function lireProfil(id: string): Promise<Profil | null> {
  let lire = profils.get(id);
  if (!lire) {
    lire = memoriser(() => getProfil(tables, id));
    profils.set(id, lire);
  }
  // A missing row is not kept, since a first Google sign-in creates it after the role choice.
  return lire().then((profil) => {
    if (profil === null) profils.delete(id);
    return profil;
  });
}

export function positionDe(profil: Profil | null): Position | null {
  return profil && profil.latitude !== null && profil.longitude !== null
    ? { lat: profil.latitude, lng: profil.longitude }
    : null;
}

// Providers with their next slot, distance and starting price, ready to sort and filter.
export async function chargerFournisseurs(
  recherche: { categorieIds?: string[]; nom?: string },
  position: Position | null,
  maintenant: Date,
): Promise<FournisseurAffiche[]> {
  const fournisseurs = await rechercherFournisseurs(tables, Query, recherche);
  const ids = fournisseurs.map((f) => f.$id);
  const depuis = maintenant.toISOString();
  const jusqua = versUtc(ajouterJours(dateLocale(depuis), JOURS_RECHERCHE), '00:00');
  const [services, specialites, creneaux] = await Promise.all([
    listerServices(tables, Query, ids),
    specialitesDe(tables, Query, ids),
    donneesCreneaux(tables, Query, ids, depuis, jusqua),
  ]);
  return preparerFournisseurs({
    fournisseurs,
    services,
    creneaux,
    specialites,
    position,
    maintenant,
  });
}

export function couleurDe(categories: Categorie[], categorieId: string): string {
  return categories.find((c) => c.$id === categorieId)?.couleur ?? 'cat1';
}
