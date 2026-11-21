import {
  getRendezVous,
  lireMesRendezVous,
  type MesRendezVous,
  type RendezVousLu,
  type ReponseApi,
  type StatutRendezVous,
} from '@fixa/core';
import { Query } from 'react-native-appwrite';
import { api } from './api';
import { tables } from './appwrite';
import { signalerChangement, useVersion } from './demandes';
import { type Lecture, useLecture } from './donnees';

export function useMesRendezVous(
  uid: string | null,
): Lecture<MesRendezVous & { maintenant: Date }> {
  const v = useVersion();
  return useLecture(`mes-rdv:${uid}:${v}`, async () => ({
    ...(uid ? await lireMesRendezVous(tables, Query, uid) : { liste: [], notes: {}, pros: {} }),
    maintenant: new Date(),
  }));
}

export function useRendezVous(id: string): Lecture<{ rdv: RendezVousLu | null; maintenant: Date }> {
  const v = useVersion();
  return useLecture(`rdv:${id}:${v}`, async () => ({
    rdv: await getRendezVous(tables, id),
    maintenant: new Date(),
  }));
}

// Cancels through the function, then every booking screen reads again whatever the outcome.
export async function annuler(
  id: string,
  motif: string,
): Promise<ReponseApi<{ statut: StatutRendezVous }>> {
  const r = await api<{ statut: StatutRendezVous }>(`/rendez-vous/${id}/annuler`, { motif });
  signalerChangement();
  return r;
}
