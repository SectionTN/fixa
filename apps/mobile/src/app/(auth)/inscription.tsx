import { erreursParChamp, forceMotDePasse, fr, LONGUEUR_MAX, schemaInscription } from '@fixa/core';
import { Bouton, ChampTexte, Icone, type InputRef, Texte } from '@fixa/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { BoutonRetour, Ecran } from '../../composants/Ecran';
import { type TypeCompte, useSession } from '../../lib/session';

const t = fr.auth.inscription;
const CHIFFRES_TELEPHONE = 8;
const COULEUR_FORCE = ['cancelled', 'pending', 'completed', 'completed'] as const;

// "22345678" shows as "22 345 678", the Tunisian grouping.
const grouper = (chiffres: string) =>
  [chiffres.slice(0, 2), chiffres.slice(2, 5), chiffres.slice(5, 8)].filter(Boolean).join(' ');

// Sign-up, e-mail variant: e-mail required, phone optional, no SMS step and so no stepper.
export default function Inscription() {
  const router = useRouter();
  const { inscription } = useSession();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const type: TypeCompte = role === 'fournisseur' ? 'fournisseur' : 'client';
  const [nomComplet, setNomComplet] = useState('');
  const [email, setEmail] = useState('');
  const [chiffres, setChiffres] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const champEmail = useRef<InputRef>(null);
  const champTelephone = useRef<InputRef>(null);
  const [accepte, setAccepte] = useState(false);
  const [tente, setTente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const verifie = schemaInscription.safeParse({
    nomComplet,
    email,
    telephone: chiffres,
    motDePasse,
  });
  const erreurs = verifie.success ? {} : erreursParChamp(verifie.error);
  const force = forceMotDePasse(motDePasse);

  async function creer() {
    setTente(true);
    if (!verifie.success || !accepte || enCours) return;
    setEnCours(true);
    setErreur(null);
    const { data } = verifie;
    const r = await inscription({
      email: data.email,
      motDePasse: data.motDePasse,
      nomComplet: data.nomComplet,
      telephone: data.telephone ? `+216 ${grouper(data.telephone)}` : '',
      type,
    });
    if (!r.ok) {
      setErreur(r.message);
      setEnCours(false);
    }
  }

  const affiche = (message?: string) => (tente ? message : undefined);

  return (
    <Ecran paddingTop="2" paddingHorizontal="6" paddingBottom={44} gap={22}>
      <BoutonRetour onPress={() => router.back()} />
      <YStack gap={10}>
        <Texte fontSize="9" fontWeight="600">
          {t.titre}
        </Texte>
        <XStack gap="2" alignItems="center">
          <Texte fontSize={15} color="color-muted">
            {t.profil}
          </Texte>
          <XStack
            height={26}
            paddingStart={6}
            paddingEnd={10}
            gap="1"
            borderRadius="round"
            backgroundColor="primary-soft"
            alignItems="center"
          >
            <Icone
              nom={type === 'client' ? 'person_search' : 'handyman'}
              taille={16}
              couleur="on-primary-soft"
            />
            <Texte fontSize="3" fontWeight="500" color="on-primary-soft">
              {type === 'client' ? t.client : t.prestataire}
            </Texte>
          </XStack>
        </XStack>
      </YStack>
      <YStack gap="4">
        <ChampTexte
          libelle={t.nom}
          icone="person"
          valeur={nomComplet}
          onChange={setNomComplet}
          maxLength={LONGUEUR_MAX.prenom + 1 + LONGUEUR_MAX.nom}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => champEmail.current?.focus()}
          erreur={affiche(erreurs.nomComplet)}
        />
        <ChampTexte
          ref={champEmail}
          libelle={t.email}
          icone="mail"
          valeur={email}
          onChange={setEmail}
          placeholder={t.emailExemple}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => champTelephone.current?.focus()}
          erreur={affiche(erreurs.email)}
        />
        <ChampTexte
          ref={champTelephone}
          libelle={t.telephone}
          prefixe="+216"
          valeur={grouper(chiffres)}
          onChange={(v) => setChiffres(v.replace(/\D/g, '').slice(0, CHIFFRES_TELEPHONE))}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          erreur={affiche(erreurs.telephone)}
        />
        <YStack gap="2">
          <ChampTexte
            libelle={t.motDePasse}
            placeholder={t.motDePasseNouveauIndice}
            motDePasse
            valeur={motDePasse}
            onChange={setMotDePasse}
            autoComplete="new-password"
            textContentType="newPassword"
            erreur={affiche(erreurs.motDePasse)}
          />
          {force > 0 ? (
            <XStack gap="2" alignItems="center" marginTop={2}>
              <XStack flex={1} gap="1">
                {[1, 2, 3, 4].map((n) => (
                  <XStack
                    key={n}
                    flex={1}
                    height={4}
                    borderRadius={9}
                    backgroundColor={n <= force ? COULEUR_FORCE[force - 1] : 'border-color'}
                  />
                ))}
              </XStack>
              <Texte fontSize="2" fontWeight="500" color={COULEUR_FORCE[force - 1]}>
                {t.force[force - 1]}
              </Texte>
            </XStack>
          ) : null}
        </YStack>
      </YStack>
      <XStack
        role="checkbox"
        accessible
        aria-checked={accepte}
        gap="3"
        alignItems="flex-start"
        onPress={() => setAccepte((a) => !a)}
      >
        <XStack
          width={22}
          height={22}
          marginTop={1}
          borderRadius={7}
          alignItems="center"
          justifyContent="center"
          backgroundColor={accepte ? 'primary' : 'transparent'}
          borderWidth={accepte ? 0 : 2}
          borderColor={tente && !accepte ? 'cancelled' : 'border-strong'}
        >
          {accepte ? <Icone nom="check" taille={16} couleur="on-primary" /> : null}
        </XStack>
        <Texte flex={1} fontSize="4" lineHeight="20px" color="color-muted">
          {t.accepte}
          <Texte fontSize="4" fontWeight="500" color="primary">
            {t.conditions}
          </Texte>
          {t.et}
          <Texte fontSize="4" fontWeight="500" color="primary">
            {t.confidentialite}
          </Texte>
          .
        </Texte>
      </XStack>
      <YStack marginTop="auto" gap={14}>
        {erreur ? (
          <Texte fontSize="3" color="cancelled" textAlign="center">
            {erreur}
          </Texte>
        ) : null}
        <Bouton taille="lg" desactive={!accepte || enCours} onPress={creer}>
          {t.creer}
        </Bouton>
        <XStack justifyContent="center">
          <Texte fontSize="4" color="color-muted">
            {t.dejaCompte}
          </Texte>
          <Texte
            role="link"
            fontSize="4"
            fontWeight="500"
            color="primary"
            onPress={() => router.replace('/connexion')}
          >
            {t.seConnecter}
          </Texte>
        </XStack>
      </YStack>
    </Ecran>
  );
}
