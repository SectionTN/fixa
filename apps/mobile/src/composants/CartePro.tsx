import {
  type FournisseurAffiche,
  formatDistance,
  formatNote,
  initiales,
  libelleCreneau,
  libelleDispo,
  textes,
} from '@fixa/core';
import { CarteFournisseur } from '@fixa/ui';
import { useRouter } from 'expo-router';
import { basculerFavori, useFavoris } from '../lib/favoris';
import { useSession } from '../lib/session';
import { vibrer } from '../lib/vibrer';

type CarteProProps = {
  pro: FournisseurAffiche;
  variante: 'ligne' | 'verticale';
  couleur: string;
  maintenant: Date;
  onPress?: () => void;
  action?: { libelle: string; onPress: () => void };
};

// A provider card wired to its profile screen, with a heart once the user is signed in.
export function CartePro({ pro, variante, couleur, maintenant, onPress, action }: CarteProProps) {
  const router = useRouter();
  const { utilisateur } = useSession();
  const uid = utilisateur?.id ?? null;
  const favori = useFavoris(uid).includes(pro.$id);
  const distance = pro.distanceKm === null ? null : formatDistance(pro.distanceKm);
  const morceaux =
    variante === 'ligne' ? [pro.specialite, pro.ville, distance] : [pro.specialite, pro.ville];
  const libelle = variante === 'ligne' ? libelleCreneau : libelleDispo;
  return (
    <CarteFournisseur
      variante={variante}
      nom={pro.nom}
      verifie={pro.statutVerification === 'VALIDE'}
      sousTitre={morceaux.filter(Boolean).join(' · ')}
      note={formatNote(pro.noteMoyenne)}
      nbAvis={pro.nbAvis}
      distance={distance}
      prix={pro.prixDepart}
      dispo={pro.prochainCreneau ? libelle(pro.prochainCreneau, maintenant) : null}
      initiales={initiales(pro.nom)}
      couleur={couleur}
      nouveau={textes.recherche.nouveau}
      onPress={onPress ?? (() => router.push({ pathname: '/pro/[id]', params: { id: pro.$id } }))}
      favori={favori}
      onFavori={
        uid
          ? () => {
              vibrer.selection();
              basculerFavori(uid, pro.$id);
            }
          : undefined
      }
      favoriLibelle={(favori ? textes.favoris.retirer : textes.favoris.ajouter)(pro.nom)}
      action={action}
    />
  );
}
