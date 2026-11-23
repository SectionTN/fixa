import { textes } from '@fixa/core';
import { EtatVide, Texte } from '@fixa/ui';
import { useRouter } from 'expo-router';
import { YStack } from 'tamagui';
import { ChoixLangue } from '../../composants/ChoixLangue';
import { Compte } from '../../composants/Compte';
import { Ecran } from '../../composants/Ecran';
import { useSession } from '../../lib/session';

const t = textes.auth.profil;
const v = textes.auth.visiteur;

// The client profile: a visitor gets the sign-in card first, then the same preferences as a client.
export default function Profil() {
  const { utilisateur } = useSession();
  const router = useRouter();
  if (utilisateur) return <Compte titre={t.titre} />;
  return (
    <Ecran paddingTop="2" paddingHorizontal="5" paddingBottom="6" gap="5">
      <Texte fontSize="9" fontWeight="600" paddingTop="1" paddingHorizontal="1">
        {t.titre}
      </Texte>
      <YStack borderRadius="5" backgroundColor="surface" paddingVertical="3">
        <EtatVide
          icone="person"
          titre={v.profilTitre}
          texte={v.profilTexte}
          action={{ libelle: v.seConnecter, onPress: () => router.push('/connexion') }}
          secondaire={{ libelle: v.creerCompte, onPress: () => router.push('/choix-role') }}
        />
      </YStack>
      <ChoixLangue />
    </Ecran>
  );
}
