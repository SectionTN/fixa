import {
  listerRendezVousFournisseur,
  type RendezVousLu,
  type ReponseApi,
  type StatutRendezVous,
} from '@fixa/core';
import { createContext, useContext, useSyncExternalStore } from 'react';
import { Query } from 'react-native-appwrite';
import { api } from './api';
import { tables } from './appwrite';
import { type Lecture, useLecture } from './donnees';

let version = 0;
const abonnes = new Set<() => void>();

// Called after a booking changes, so every booking screen reads its rows again.
export function signalerChangement() {
  version += 1;
  for (const abonne of abonnes) abonne();
}

export function useVersion(): number {
  return useSyncExternalStore(
    (abonne) => {
      abonnes.add(abonne);
      return () => {
        abonnes.delete(abonne);
      };
    },
    () => version,
  );
}

export type Demandes = { liste: RendezVousLu[]; maintenant: Date };

export function useLireDemandes(uid: string | null): Lecture<Demandes> {
  const v = useVersion();
  return useLecture(
    `demandes:${uid}`,
    async () => ({
      liste: uid ? await listerRendezVousFournisseur(tables, Query, uid) : [],
      maintenant: new Date(),
    }),
    v,
  );
}

// Read once by the provider tabs, so the Demandes badge and the list never disagree.
export const DemandesContexte = createContext<Lecture<Demandes> | null>(null);

export function useDemandes(): Lecture<Demandes> {
  const lecture = useContext(DemandesContexte);
  if (!lecture) throw new Error('useDemandes is only available inside the provider tabs');
  return lecture;
}

// Answers a request through the function, then every provider screen reads again whatever the outcome.
export async function repondre(
  id: string,
  action: 'accepter' | 'refuser' | 'terminer',
  motif?: string,
): Promise<ReponseApi<{ statut: StatutRendezVous }>> {
  const r = await api<{ statut: StatutRendezVous }>(
    `/rendez-vous/${id}/${action}`,
    motif === undefined ? {} : { motif },
  );
  signalerChangement();
  return r;
}
