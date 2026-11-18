import { fr, schemaConnexion } from '@fixa/core';
import { Bouton, ChampTexte, Texte } from '@fixa/ui';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';

const t = fr.auth.adminConnexion;

// No design exists for the admin login, so it takes the mobile login card on a centred page.
export function Connexion({
  message,
  onConnexion,
}: {
  message?: string;
  onConnexion: (email: string, motDePasse: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [enCours, setEnCours] = useState(false);
  const pret = schemaConnexion.safeParse({ email, motDePasse }).success;

  async function valider() {
    if (!pret || enCours) return;
    setEnCours(true);
    await onConnexion(email, motDePasse);
    setEnCours(false);
  }

  return (
    <YStack
      minHeight="100vh"
      alignItems="center"
      justifyContent="center"
      padding="6"
      backgroundColor="background"
    >
      <YStack
        width="100%"
        maxWidth={420}
        padding="7"
        gap={26}
        borderRadius="5"
        backgroundColor="surface"
      >
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
          <Texte render="h1" margin={0} fontSize="9" fontWeight="600">
            {t.titre}
          </Texte>
          <Texte fontSize="5" lineHeight="24px" color="color-muted">
            {t.sousTitre}
          </Texte>
        </YStack>
        <YStack gap="4">
          <ChampTexte
            libelle={fr.auth.inscription.email}
            icone="mail"
            valeur={email}
            onChange={setEmail}
            placeholder={fr.auth.inscription.emailExemple}
            autoComplete="email"
          />
          <ChampTexte
            libelle={fr.auth.inscription.motDePasse}
            motDePasse
            valeur={motDePasse}
            onChange={setMotDePasse}
            autoComplete="current-password"
            onSubmitEditing={valider}
            erreur={message ?? null}
          />
        </YStack>
        <Bouton taille="lg" desactive={!pret || enCours} onPress={valider}>
          {fr.auth.connexion.seConnecter}
        </Bouton>
      </YStack>
    </YStack>
  );
}
