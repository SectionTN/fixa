import { type Acteur, type Fournisseur, type ReponseApi, TABLES } from '@fixa/core';
import type { Db } from '@fixa/fn-commun';
import { echec, succes } from '../reponse';

const ESSAI_JOURS = 90;
const JOUR_MS = 86_400_000;

export async function deciderFournisseur(
  db: Db,
  acteur: Acteur,
  fournisseurId: string,
  decision: 'valider' | 'refuser',
  motif?: string,
  maintenant: Date = new Date(),
): Promise<ReponseApi<{ statutVerification: 'VALIDE' | 'REFUSE' }>> {
  if (acteur.role !== 'admin') return echec('NON_AUTORISE');
  const fournisseur = await db.getRow<Fournisseur>(TABLES.fournisseurs, fournisseurId);
  if (!fournisseur) return echec('INTROUVABLE');
  // A second decision would restart the trial or hide a provider already validated.
  if (fournisseur.statutVerification !== 'EN_ATTENTE') return echec('DOSSIER_TRAITE');

  if (decision === 'valider') {
    await db.updateRow<Fournisseur>(TABLES.fournisseurs, fournisseurId, {
      statutVerification: 'VALIDE',
      visible: true,
      motifRefus: null,
      finEssai: new Date(maintenant.getTime() + ESSAI_JOURS * JOUR_MS).toISOString(),
    });
    return succes({ statutVerification: 'VALIDE' });
  }
  await db.updateRow<Fournisseur>(TABLES.fournisseurs, fournisseurId, {
    statutVerification: 'REFUSE',
    visible: false,
    motifRefus: motif ?? null,
  });
  return succes({ statutVerification: 'REFUSE' });
}
