import { fr } from '@fixa/core';
import { Bouton, Texte } from '@fixa/ui';
import { Ecran } from '../../composants/Ecran';
import { useSession } from '../../lib/session';

// The provider shell, replaced by the requests list when bookings reach providers.
export default function Demandes() {
  const { utilisateur, deconnexion } = useSession();
  return (
    <Ecran paddingTop="2" paddingHorizontal="5" paddingBottom="6" gap="5">
      <Texte fontSize="9" fontWeight="600">
        Demandes
      </Texte>
      <Texte fontSize="5" color="color-muted">
        {utilisateur?.nom}
      </Texte>
      <Bouton variante="outline" icone="logout" onPress={deconnexion}>
        {fr.auth.profil.deconnexion}
      </Bouton>
    </Ecran>
  );
}
