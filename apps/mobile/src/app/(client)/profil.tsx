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

// The client profile: a visitor is invited to sign in, a client sees the account.
export default function Profil() {
  const { utilisateur } = useSession();
  const router = useRouter();
  if (utilisateur) return <Compte titre={t.titre} />;
  return (
    <Ecran paddingTop="2" paddingHorizontal="5" gap="5">
      <Texte fontSize="9" fontWeight="600" paddingTop="1" paddingHorizontal="1">
        {t.titre}
      </Texte>
      <YStack flex={1} justifyContent="center" paddingBottom="9">
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
