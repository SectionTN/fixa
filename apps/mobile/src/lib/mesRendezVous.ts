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

// Publishes the review through the function, which marks the booking reviewed and counts the rating once.
export async function laisserAvis(corps: {
  rendezVousId: string;
  note: number;
  criteres: string[];
  commentaire: string;
}): Promise<ReponseApi<{ avisId: string }>> {
  const r = await api<{ avisId: string }>('/avis', corps);
  signalerChangement();
  return r;
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
