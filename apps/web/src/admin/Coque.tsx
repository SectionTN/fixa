import { fr } from '@fixa/core';
import { Icone, type NomIcone, Texte } from '@fixa/ui';
import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';

const t = fr.admin;

function Groupe({ children }: { children: string }) {
  return (
    <Texte
      fontSize="2"
      fontWeight="500"
      color="color-subtle"
      paddingTop={14}
      paddingHorizontal="3"
      paddingBottom="1"
    >
      {children}
    </Texte>
  );
}

function Lien({
  icone,
  libelle,
  actif = false,
  inactif = false,
  compte,
}: {
  icone: NomIcone;
  libelle: string;
  actif?: boolean;
  inactif?: boolean;
  compte?: number;
}) {
  const couleur = actif ? 'on-primary-soft' : inactif ? 'color-subtle' : 'color-muted';
  return (
    <XStack
      height="4"
      paddingHorizontal="3"
      gap="3"
      borderRadius="3"
      alignItems="center"
      aria-current={actif ? 'page' : undefined}
      aria-disabled={inactif || undefined}
      backgroundColor={actif ? 'primary-soft' : 'transparent'}
    >
      <Icone nom={icone} taille={21} couleur={couleur} />
      <Texte flex={1} fontSize="4" fontWeight={actif ? '600' : '500'} color={couleur}>
        {libelle}
      </Texte>
      {compte !== undefined ? (
        <XStack
          minWidth={22}
          height={22}
          paddingHorizontal={7}
          borderRadius="round"
          backgroundColor="background-press"
          alignItems="center"
          justifyContent="center"
        >
          <Texte fontSize={11.5} fontWeight="600">
            {compte}
          </Texte>
        </XStack>
      ) : null}
    </XStack>
  );
}

const initiales = (nom: string) =>
  nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase())
    .join('');

// The admin sidebar trimmed to the demo: dashboard, validation with its count, users greyed.
export function Coque({
  nom,
  aValider,
  onDeconnexion,
  children,
}: {
  nom: string;
  aValider: number | null;
  onDeconnexion: () => void;
  children: ReactNode;
}) {
  return (
    <XStack minHeight="100vh" backgroundColor="background">
      <YStack
        render="nav"
        width={264}
        backgroundColor="surface"
        borderEndWidth={1}
        borderColor="border-color"
        paddingVertical="5"
        paddingHorizontal="4"
        gap="1"
      >
        <XStack
          paddingTop="1"
          paddingHorizontal="2"
          paddingBottom="2"
          alignItems="center"
          justifyContent="space-between"
        >
          <XStack gap={10} alignItems="center">
            <XStack
              position="relative"
              width={32}
              height={32}
              borderRadius="2"
              backgroundColor="primary"
              alignItems="center"
              justifyContent="center"
            >
              <Texte fontSize="7" fontWeight="600" color="on-primary">
                f
              </Texte>
              <XStack
                position="absolute"
                top={6}
                insetInlineEnd={6}
                width={5}
                height={5}
                borderRadius="round"
                backgroundColor="accent"
              />
            </XStack>
            <Texte fontSize="7" fontWeight="600" letterSpacing={-0.4}>
              fixa
            </Texte>
          </XStack>
          <XStack
            height={24}
            paddingHorizontal={10}
            borderRadius="round"
            backgroundColor="background-press"
            alignItems="center"
          >
            <Texte fontSize="2" fontWeight="500" color="color-muted">
              {t.backOffice}
            </Texte>
          </XStack>
        </XStack>
        <Groupe>{t.pilotage}</Groupe>
        <Lien icone="space_dashboard_fill" libelle={t.tableauDeBord} actif />
        <Groupe>{t.moderation}</Groupe>
        <Lien icone="how_to_reg" libelle={t.validation} compte={aValider ?? undefined} />
        <Lien icone="group" libelle={t.utilisateurs} inactif />
        <YStack flex={1} />
        <XStack
          marginTop="2"
          padding={10}
          gap={10}
          borderRadius="4"
          backgroundColor="background-soft"
          alignItems="center"
        >
          <XStack
            width={36}
            height={36}
            borderRadius="round"
            backgroundColor="cat6-soft"
            alignItems="center"
            justifyContent="center"
          >
            <Texte fontSize="3" fontWeight="600" color="cat6">
              {initiales(nom)}
            </Texte>
          </XStack>
          <YStack flex={1}>
            <Texte fontSize="4" fontWeight="600">
              {nom}
            </Texte>
            <Texte fontSize="2" color="color-muted">
              {t.administratrice}
            </Texte>
          </YStack>
          <XStack
            render="button"
            role="button"
            aria-label={fr.auth.profil.deconnexion}
            width={36}
            height={36}
            borderWidth={0}
            borderRadius="round"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            backgroundColor="transparent hover:background-press"
            onPress={onDeconnexion}
          >
            <Icone nom="logout" taille={18} couleur="color-muted" />
          </XStack>
        </XStack>
      </YStack>
      <YStack render="main" flex={1}>
        {children}
      </YStack>
    </XStack>
  );
}
