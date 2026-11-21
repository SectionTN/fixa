import {
  type Acteur,
  appliquerAction,
  doitExpirer,
  doitTerminerAuto,
  type RendezVous,
  TABLES,
} from '@fixa/core';
import { type Db, libererCellules, STATUTS_LIBERANT, sousVerrou } from '@fixa/fn-commun';

const SYSTEME: Acteur = { id: 'systeme', role: 'systeme' };

// Open bookings read per tick, far above what the demo holds between two runs.
const LIMITE_PAR_STATUT = 500;

// Same lock as the api, so a provider answering at the same moment wins or loses cleanly.
async function passer(
  db: Db,
  rdv: RendezVous,
  action: 'expirer' | 'terminer',
  maintenant: Date,
): Promise<boolean> {
  const resultat = appliquerAction(rdv, action, SYSTEME, maintenant);
  if (!resultat.ok) return false;
  // The cells go before the status, so a failed release leaves the row for the next tick to retry.
  return sousVerrou(db, rdv, resultat.statut, SYSTEME.role, async () => {
    if (STATUTS_LIBERANT.includes(resultat.statut)) await libererCellules(db, rdv.$id);
    await db.updateRow<RendezVous>(TABLES.rendezVous, rdv.$id, { statut: resultat.statut });
  });
}

// One scheduled run: expire unanswered requests past their deadline, complete appointments ended long enough ago.
export async function executerTick(
  db: Db,
  maintenant: Date,
  journal: (message: string) => void = () => {},
): Promise<{ expires: number; termines: number }> {
  const [enAttente, confirmes] = await Promise.all([
    db.listRows<RendezVous>(TABLES.rendezVous, {
      egal: { statut: 'EN_ATTENTE' },
      limite: LIMITE_PAR_STATUT,
    }),
    db.listRows<RendezVous>(TABLES.rendezVous, {
      egal: { statut: 'CONFIRME' },
      limite: LIMITE_PAR_STATUT,
    }),
  ]);
  // A booking that fails is logged and retried on the next tick, the others still run.
  const essayer = async (rdv: RendezVous, action: 'expirer' | 'terminer') => {
    try {
      return await passer(db, rdv, action, maintenant);
    } catch (e) {
      journal(`${action} ${rdv.$id}: ${e instanceof Error ? e.message : String(e)}`);
      return false;
    }
  };
  let expires = 0;
  let termines = 0;
  for (const rdv of enAttente.filter((r) => doitExpirer(r, maintenant))) {
    if (await essayer(rdv, 'expirer')) expires += 1;
  }
  for (const rdv of confirmes.filter((r) => doitTerminerAuto(r, maintenant))) {
    if (await essayer(rdv, 'terminer')) termines += 1;
  }
  return { expires, termines };
}
