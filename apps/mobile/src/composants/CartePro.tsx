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

type CarteProProps = {
  pro: FournisseurAffiche;
  variante: 'ligne' | 'verticale';
  couleur: string;
  maintenant: Date;
  onPress?: () => void;
};

// A provider card wired to its profile screen.
export function CartePro({ pro, variante, couleur, maintenant, onPress }: CarteProProps) {
  const router = useRouter();
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
    />
  );
}
