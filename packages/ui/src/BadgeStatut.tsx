import { XStack } from 'tamagui';
import { Icone } from './Icone';
import { Texte } from './Texte';

const STYLES = {
  EN_ATTENTE: { icone: 'schedule', ton: 'pending' },
  CONFIRME: { icone: 'event_available', ton: 'confirmed' },
  TERMINE: { icone: 'task_alt', ton: 'completed' },
  ANNULE: { icone: 'cancel', ton: 'cancelled' },
  REFUSE: { icone: 'block', ton: 'cancelled' },
  EXPIRE: { icone: 'timer_off', ton: 'cancelled' },
} as const;

export type StatutBadge = keyof typeof STYLES;

// A booking status, always an icon with its label so colour is never the only signal.
export function BadgeStatut({ statut, libelle }: { statut: StatutBadge; libelle: string }) {
  const { icone, ton } = STYLES[statut];
  return (
    <XStack
      height={26}
      paddingStart={6}
      paddingEnd={10}
      gap={4}
      borderRadius="round"
      backgroundColor={`${ton}-soft`}
      alignItems="center"
      alignSelf="flex-start"
    >
      <Icone nom={icone} taille={15} couleur={ton} />
      <Texte fontSize="2" fontWeight="500" color={ton}>
        {libelle}
      </Texte>
    </XStack>
  );
}
