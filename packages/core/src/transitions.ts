import { estAnnulationTardive } from './delais';
import type { Acteur, ActionRendezVous, RendezVous, StatutRendezVous } from './domaine';
import type { CodeErreur } from './erreurs';

type RdvTransition = Pick<
  RendezVous,
  'statut' | 'debut' | 'dateLimiteReponse' | 'clientId' | 'fournisseurId'
>;
type Resultat =
  | { ok: true; statut: StatutRendezVous; annulationTardive: boolean }
  | { ok: false; code: CodeErreur };

const refus = (code: CodeErreur): Resultat => ({ ok: false, code });
const vers = (statut: StatutRendezVous, annulationTardive = false): Resultat => ({
  ok: true,
  statut,
  annulationTardive,
});

export function appliquerAction(
  rdv: RdvTransition,
  action: ActionRendezVous,
  acteur: Acteur,
  maintenant: Date,
): Resultat {
  const estFournisseur = acteur.role === 'fournisseur' && acteur.id === rdv.fournisseurId;
  const estClient = acteur.role === 'client' && acteur.id === rdv.clientId;
  const estSysteme = acteur.role === 'systeme';
  const t = maintenant.getTime();
  const debut = Date.parse(rdv.debut);
  const limite = Date.parse(rdv.dateLimiteReponse);

  switch (action) {
    case 'accepter':
      if (!estFournisseur) return refus('NON_AUTORISE');
      if (rdv.statut !== 'EN_ATTENTE') return refus('TRANSITION_INVALIDE');
      if (t > limite) return refus('DELAI_DEPASSE');
      return vers('CONFIRME');
    case 'refuser':
      if (!estFournisseur) return refus('NON_AUTORISE');
      if (rdv.statut !== 'EN_ATTENTE') return refus('TRANSITION_INVALIDE');
      return vers('REFUSE');
    case 'annuler':
      if (!estClient && !estFournisseur) return refus('NON_AUTORISE');
      if (rdv.statut !== 'EN_ATTENTE' && rdv.statut !== 'CONFIRME') {
        return refus('TRANSITION_INVALIDE');
      }
      if (t >= debut) return refus('TRANSITION_INVALIDE');
      return vers('ANNULE', estClient && estAnnulationTardive(new Date(debut), maintenant));
    case 'terminer':
      if (!estFournisseur && !estSysteme) return refus('NON_AUTORISE');
      if (rdv.statut !== 'CONFIRME') return refus('TRANSITION_INVALIDE');
      if (t < debut) return refus('TROP_TOT');
      return vers('TERMINE');
    case 'expirer':
      if (!estSysteme) return refus('NON_AUTORISE');
      if (rdv.statut !== 'EN_ATTENTE' || t <= limite) return refus('TRANSITION_INVALIDE');
      return vers('EXPIRE');
  }
}
