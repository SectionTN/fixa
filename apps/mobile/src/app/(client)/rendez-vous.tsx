import { fr } from '@fixa/core';
import { EtatVide, Texte } from '@fixa/ui';
import { useRouter } from 'expo-router';
import { YStack } from 'tamagui';
import { Ecran } from '../../composants/Ecran';
import { useSession } from '../../lib/session';

const v = fr.auth.visiteur;

// My appointments, filled in when bookings reach clients.
export default function RendezVous() {
  const { utilisateur } = useSession();
  const router = useRouter();
  return (
    <Ecran paddingTop="2" paddingHorizontal="5" gap="5">
      <Texte fontSize="9" fontWeight="600">
        {fr.rendezVous.titre}
      </Texte>
      {utilisateur ? null : (
        <YStack flex={1} justifyContent="center" paddingBottom="9">
          <EtatVide
            icone="event_upcoming"
            titre={v.rdvTitre}
            texte={v.rdvTexte}
            action={{ libelle: v.seConnecter, onPress: () => router.push('/connexion') }}
          />
        </YStack>
      )}
    </Ecran>
  );
}
