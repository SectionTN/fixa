import { Input, type InputProps } from '@tamagui/input';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { Icone } from './Icone';
import type { NomIcone } from './icones.generated';
import { Texte } from './Texte';

export type ChampTexteProps = Pick<
  InputProps,
  | 'autoCapitalize'
  | 'autoComplete'
  | 'keyboardType'
  | 'maxLength'
  | 'onSubmitEditing'
  | 'placeholder'
  | 'returnKeyType'
  | 'textContentType'
> & {
  libelle: string;
  valeur: string;
  onChange: (valeur: string) => void;
  icone?: NomIcone;
  prefixe?: string;
  motDePasse?: boolean;
  erreur?: string | null;
  aide?: string;
};

export function ChampTexte({
  libelle,
  valeur,
  onChange,
  icone,
  prefixe,
  motDePasse = false,
  erreur,
  aide,
  ...entree
}: ChampTexteProps) {
  const [focus, setFocus] = useState(false);
  const [visible, setVisible] = useState(false);
  const masque = motDePasse && !visible;
  return (
    <YStack gap={6}>
      <Texte fontSize="3" fontWeight="500" color="color-muted">
        {libelle}
      </Texte>
      <XStack
        height="5"
        borderRadius="4"
        paddingHorizontal="4"
        gap={10}
        alignItems="center"
        borderWidth={2}
        borderColor={erreur ? 'cancelled' : focus ? 'primary' : 'transparent'}
        backgroundColor={focus && !erreur ? 'surface' : 'background-soft'}
      >
        {icone ? <Icone nom={icone} taille={20} couleur="color-subtle" /> : null}
        {prefixe ? (
          <Texte
            fontSize="5"
            fontWeight="500"
            paddingEnd={10}
            borderEndWidth={1}
            borderColor="border-color"
          >
            {prefixe}
          </Texte>
        ) : null}
        <Input
          flex={1}
          minWidth={0}
          height="100%"
          padding={0}
          borderWidth={0}
          outlineWidth={0}
          backgroundColor="transparent"
          fontFamily="body"
          fontSize="5"
          color="color"
          letterSpacing={masque && valeur ? 2 : 0}
          placeholderTextColor="color-subtle"
          aria-label={libelle}
          aria-invalid={Boolean(erreur)}
          value={valeur}
          onChangeText={onChange}
          secureTextEntry={masque}
          // On the web secureTextEntry alone leaves the value readable, the input type masks it.
          type={motDePasse ? (masque ? 'password' : 'text') : undefined}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          {...entree}
        />
        {motDePasse ? (
          <XStack
            role="button"
            aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            width={44}
            height={44}
            marginEnd={-12}
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            onPress={() => setVisible((v) => !v)}
          >
            <Icone
              nom={visible ? 'visibility' : 'visibility_off'}
              taille={20}
              couleur="color-muted"
            />
          </XStack>
        ) : null}
      </XStack>
      {erreur ? (
        <XStack gap={6} alignItems="center">
          <Icone nom="error" taille={16} couleur="cancelled" />
          <Texte fontSize="3" color="cancelled">
            {erreur}
          </Texte>
        </XStack>
      ) : aide ? (
        <Texte fontSize="3" color="color-muted">
          {aide}
        </Texte>
      ) : null}
    </YStack>
  );
}
