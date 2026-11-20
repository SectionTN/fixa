import {
  delaiDepasse,
  formatPrixService,
  fr,
  heureLocale,
  ilYA,
  initiales,
  jourCourtLocal,
  libelleAvant,
  type RendezVousLu,
} from '@fixa/core';
import { BadgeStatut, CarteDemande } from '@fixa/ui';
import { useRouter } from 'expo-router';

const t = fr.demandes;

// A booking row as a request card, with Accepter and Refuser only while the provider can still answer.
export function CarteRdvPro({
  rdv,
  maintenant,
  occupe,
  onAccepter,
  onOuvrir,
}: {
  rdv: RendezVousLu;
  maintenant: Date;
  occupe: boolean;
  onAccepter: (id: string) => void;
  /** Shows the request somewhere other than its own screen, such as the pane next to the list. */
  onOuvrir?: (id: string, refuser: boolean) => void;
}) {
  const router = useRouter();
  const enRetard = delaiDepasse(rdv, maintenant);
  const ouvert = rdv.statut === 'EN_ATTENTE' && !enRetard;
  const sousTitre = [ilYA(rdv.$createdAt, maintenant), rdv.source === 'CHATBOT' ? t.viaYosr : null]
    .filter(Boolean)
    .join(' · ');
  const ouvrir = (refuser = false) => {
    if (onOuvrir) {
      onOuvrir(rdv.$id, refuser);
      return;
    }
    router.push({
      pathname: '/demande/[id]',
      params: refuser ? { id: rdv.$id, refuser: '1' } : { id: rdv.$id },
    });
  };
  return (
    <CarteDemande
      nom={rdv.clientNom}
      initiales={initiales(rdv.clientNom)}
      sousTitre={sousTitre}
      urgent={rdv.estUrgent && ouvert ? t.urgent : undefined}
      lignes={[
        { icone: 'handyman', texte: `${rdv.serviceTitre} · ${formatPrixService(rdv)}` },
        {
          icone: 'calendar_month',
          texte: `${jourCourtLocal(rdv.debut)} · ${heureLocale(rdv.debut)}`,
        },
        ...(rdv.adresse ? [{ icone: 'location_on' as const, texte: rdv.adresse }] : []),
      ]}
      citation={rdv.description || undefined}
      delai={ouvert ? libelleAvant(rdv.dateLimiteReponse, maintenant) : undefined}
      badge={
        enRetard ? (
          <BadgeStatut statut="EXPIRE" libelle={t.delaiDepasse} />
        ) : (
          <BadgeStatut statut={rdv.statut} libelle={fr.statuts[rdv.statut]} />
        )
      }
      refuser={ouvert ? { libelle: t.refuser, onPress: () => ouvrir(true) } : undefined}
      accepter={
        ouvert
          ? { libelle: t.accepter, onPress: () => onAccepter(rdv.$id), desactive: occupe }
          : undefined
      }
      onPress={() => ouvrir()}
    />
  );
}
