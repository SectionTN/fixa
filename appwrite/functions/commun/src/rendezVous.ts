import {
  type CreneauOccupe,
  type RendezVous,
  type Role,
  type StatutRendezVous,
  TABLES,
  type Transition,
} from '@fixa/core';
import { type Db, estAbsent, estConflit } from './db';

export const STATUTS_LIBERANT: readonly StatutRendezVous[] = ['REFUSE', 'EXPIRE', 'ANNULE'];

// A cell another call already deleted counts as freed.
export async function supprimerCellules(db: Db, ids: string[]) {
  await Promise.all(
    ids.map(async (id) => {
      try {
        await db.deleteRow(TABLES.creneauxOccupes, id);
      } catch (e) {
        if (!estAbsent(e)) throw e;
      }
    }),
  );
}

export async function libererCellules(db: Db, rendezVousId: string) {
  const cases = await db.listRows<CreneauOccupe>(TABLES.creneauxOccupes, {
    egal: { rendezVousId },
  });
  await supprimerCellules(
    db,
    cases.map((c) => c.$id),
  );
}

// One row per booking and starting status, so of two changes from the same status only the first passes.
export async function verrouillerTransition(
  db: Db,
  rdv: Pick<RendezVous, '$id' | 'statut'>,
  vers: StatutRendezVous,
  par: Role,
): Promise<boolean> {
  try {
    await db.createRow<Transition>(TABLES.transitions, `${rdv.$id}.${rdv.statut}`, {
      rendezVousId: rdv.$id,
      de: rdv.statut,
      vers,
      par,
    });
    return true;
  } catch (e) {
    if (estConflit(e)) return false;
    throw e;
  }
}

// Runs the change under the lock and gives the lock back when it fails, so a later call can try again.
export async function sousVerrou(
  db: Db,
  rdv: Pick<RendezVous, '$id' | 'statut'>,
  vers: StatutRendezVous,
  par: Role,
  changer: () => Promise<unknown>,
): Promise<boolean> {
  if (!(await verrouillerTransition(db, rdv, vers, par))) return false;
  try {
    await changer();
  } catch (e) {
    await db.deleteRow(TABLES.transitions, `${rdv.$id}.${rdv.statut}`).catch(() => undefined);
    throw e;
  }
  return true;
}
