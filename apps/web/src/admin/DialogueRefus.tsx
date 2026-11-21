import { fr, motifRefus } from '@fixa/core';
import { Bouton, ChampTexte, Icone, Puce, Texte } from '@fixa/ui';
import {
  type MouseEvent,
  type PointerEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { XStack, YStack } from 'tamagui';

const t = fr.admin;

// Leaves room for the reason, the motif column holds 500 characters.
const MESSAGE_MAX = 400;

// The browser's modal dialog: the page behind is inert, Escape closes it and focus returns to the opener.
const CADRE = {
  padding: 0,
  margin: 0,
  border: 0,
  width: '100vw',
  height: '100vh',
  maxWidth: '100vw',
  maxHeight: '100vh',
  background: 'transparent',
  overflow: 'hidden',
} as const;

// Mounted while open, so each opening starts with no reason picked and an empty message.
export function DialogueRefus({
  nom,
  envoi,
  erreur,
  onFermer,
  onRefuser,
}: {
  nom: string;
  envoi: boolean;
  erreur: string | null;
  onFermer: () => void;
  onRefuser: (motif: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titreId = useId();
  const motifId = useId();
  const [raison, setRaison] = useState<string | null>(null);
  const [mot, setMot] = useState('');

  // A layout cleanup closes the dialog while it is still in the page, so the browser returns focus to the opener.
  useLayoutEffect(() => {
    const dialogue = ref.current;
    dialogue?.showModal();
    return () => dialogue?.close();
  }, []);

  // Only a press that starts and ends on the overlay closes, not a text selection dragged out of the card.
  const appuiSurFond = useRef(false);
  const surFond = (e: MouseEvent) => {
    if (appuiSurFond.current && e.target === e.currentTarget && !envoi) onFermer();
    appuiSurFond.current = false;
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titreId}
      style={CADRE}
      onCancel={(e) => {
        e.preventDefault();
        if (!envoi) onFermer();
      }}
    >
      <YStack
        width="100%"
        height="100%"
        padding="5"
        backgroundColor="overlay"
        alignItems="center"
        justifyContent="center"
        onPointerDown={(e: PointerEvent) => {
          appuiSurFond.current = e.target === e.currentTarget;
        }}
        onClick={surFond}
      >
        <YStack
          width={580}
          maxWidth="100%"
          maxHeight="92%"
          borderRadius={28}
          backgroundColor="surface"
          overflow="hidden"
          shadowColor="shadow-color"
          shadowOffset={{ width: 0, height: 14 }}
          shadowRadius={36}
        >
          <XStack paddingTop="6" paddingHorizontal="6" gap="3" alignItems="flex-start">
            <YStack flex={1} gap="1">
              <Texte id={titreId} render="h2" margin={0} fontSize="7" fontWeight="600">
                {t.refusTitre(nom)}
              </Texte>
              <Texte fontSize="4" color="color-muted">
                {t.refusSousTitre}
              </Texte>
            </YStack>
            {/* A 44 px target around the 36 px circle of the design. */}
            <XStack
              render="button"
              role="button"
              aria-label={fr.commun.fermer}
              width={44}
              height={44}
              margin={-4}
              borderWidth={0}
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              backgroundColor="transparent"
              onPress={envoi ? undefined : onFermer}
            >
              <XStack
                width={36}
                height={36}
                borderRadius="round"
                alignItems="center"
                justifyContent="center"
                backgroundColor="background-soft"
              >
                <Icone nom="close" taille={20} couleur="color-muted" />
              </XStack>
            </XStack>
          </XStack>
          <YStack paddingVertical="5" paddingHorizontal="6" gap="4">
            <Texte id={motifId} fontSize={15} fontWeight="600">
              {t.motif}
            </Texte>
            <XStack flexWrap="wrap" gap="2" role="group" aria-labelledby={motifId}>
              {t.motifs.map((m) => (
                <Puce
                  key={m}
                  libelle={m}
                  etat={raison === m ? 'choisi' : 'repos'}
                  icone={raison === m ? 'check' : undefined}
                  onPress={() => setRaison(m)}
                />
              ))}
            </XStack>
            <ChampTexte
              libelle={t.messagePrestataire}
              valeur={mot}
              onChange={setMot}
              maxLength={MESSAGE_MAX}
              aide={fr.reservation.compteur(mot.length, MESSAGE_MAX)}
              multiligne
            />
            {erreur ? (
              <XStack gap="2" alignItems="center" role="alert">
                <Icone nom="error" taille={18} couleur="cancelled" />
                <Texte fontSize="4" color="cancelled">
                  {erreur}
                </Texte>
              </XStack>
            ) : null}
          </YStack>
          <XStack
            paddingVertical="4"
            paddingHorizontal="6"
            gap={10}
            justifyContent="flex-end"
            borderTopWidth={1}
            borderColor="border-color"
          >
            <Bouton variante="outline" desactive={envoi} onPress={onFermer}>
              {t.annuler}
            </Bouton>
            <Bouton
              variante="destructif"
              desactive={!raison || envoi}
              onPress={() => raison && onRefuser(motifRefus(raison, mot))}
            >
              {t.refuserDossier}
            </Bouton>
          </XStack>
        </YStack>
      </YStack>
    </dialog>
  );
}
