import { schemaConnexion, textes } from '@fixa/core';
import { Bouton, ChampTexte, type InputRef, Texte } from '@fixa/ui';
import { useCanGoBack, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { BoutonRetour, Ecran } from '../../composants/Ecran';
import { useSession } from '../../lib/session';

const t = textes.auth.connexion;

// Login, e-mail variant: no SMS button, no password recovery until a redirect page exists.
export default function Connexion() {
  const router = useRouter();
  const peutRevenir = useCanGoBack();
  const { connexion, connexionGoogle } = useSession();
  // Opened from a screen such as a pro's profile, sign-in returns to it before the guards move the user home.
  const reprendre = () => {
    if (peutRevenir) router.back();
  };
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const champMotDePasse = useRef<InputRef>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const pret = schemaConnexion.safeParse({ email, motDePasse }).success;

  async function google() {
    if (enCours) return;
    setEnCours(true);
    setErreur(null);
    const r = await connexionGoogle();
    if (r !== 'annule' && !r.ok) setErreur(r.message);
    setEnCours(false);
  }

  async function valider() {
    if (!pret || enCours) return;
    setEnCours(true);
    setErreur(null);
    const r = await connexion(email, motDePasse);
    if (!r.ok) {
      setErreur(r.message);
      setEnCours(false);
      return;
    }
    reprendre();
  }

  return (
    <Ecran paddingTop={28} paddingHorizontal="6" paddingBottom={44} gap={26}>
      {peutRevenir ? <BoutonRetour onPress={() => router.back()} /> : null}
      <XStack
        position="relative"
        width={56}
        height={56}
        borderRadius={18}
        backgroundColor="primary"
        alignItems="center"
        justifyContent="center"
      >
        <Texte fontSize={34} lineHeight="40px" fontWeight="600" color="on-primary">
          f
        </Texte>
        <XStack
          position="absolute"
          top={10}
          insetInlineEnd={10}
          width={8}
          height={8}
          borderRadius="round"
          backgroundColor="accent"
        />
      </XStack>
      <YStack gap={10}>
        <Texte fontSize="9" fontWeight="600">
          {t.titre}
        </Texte>
        <Texte fontSize="5" lineHeight="24px" color="color-muted">
          {t.sousTitre}
        </Texte>
      </YStack>
      <YStack gap="4">
        <ChampTexte
          libelle={textes.auth.inscription.email}
          icone="mail"
          valeur={email}
          onChange={setEmail}
          placeholder={textes.auth.inscription.emailExemple}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => champMotDePasse.current?.focus()}
        />
        <ChampTexte
          ref={champMotDePasse}
          libelle={textes.auth.inscription.motDePasse}
          placeholder={textes.auth.inscription.motDePasseIndice}
          motDePasse
          valeur={motDePasse}
          onChange={setMotDePasse}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={valider}
          erreur={erreur}
        />
      </YStack>
      <YStack gap="3">
        <Bouton taille="lg" desactive={!pret || enCours} onPress={valider}>
          {t.seConnecter}
        </Bouton>
        <XStack marginVertical="1" gap="3" alignItems="center">
          <XStack flex={1} height={1} backgroundColor="border-color" />
          <Texte fontSize="3" color="color-subtle">
            {t.ou}
          </Texte>
          <XStack flex={1} height={1} backgroundColor="border-color" />
        </XStack>
        <Bouton
          taille="lg"
          variante="outline"
          desactive={enCours}
          onPress={google}
          debut={
            <XStack
              width={20}
              height={20}
              marginEnd={2}
              borderRadius="round"
              backgroundColor="background-press"
              alignItems="center"
              justifyContent="center"
            >
              <Texte fontSize="2" lineHeight="14px" fontWeight="700">
                G
              </Texte>
            </XStack>
          }
        >
          {t.google}
        </Bouton>
      </YStack>
      <XStack marginTop="auto" justifyContent="center">
        <Texte fontSize="4" color="color-muted">
          {t.nouveau}
        </Texte>
        <Texte
          role="link"
          fontSize="4"
          fontWeight="500"
          color="primary"
          onPress={() => router.push('/choix-role')}
        >
          {t.creerCompte}
        </Texte>
      </XStack>
    </Ecran>
  );
}
