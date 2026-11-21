import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import { Bouton, type VarianteBouton } from './Bouton';
import { Etoiles } from './Etoiles';
import { Icone } from './Icone';
import type { NomIcone } from './icones.generated';
import { Texte } from './Texte';

const OMBRE = {
  shadowColor: 'shadow-color',
  shadowOffset: { width: 0, height: 1 },
  shadowRadius: 3,
} as const;

export type ActionCarteRendezVous = {
  libelle: string;
  variante: VarianteBouton;
  icone?: NomIcone;
  onPress: () => void;
};

export type CarteRendezVousProps = {
  /** The short weekday, such as "LUN". */
  jour: string;
  /** The day of the month. */
  numero: string;
  /** Greys the date block of an appointment that is over. */
  passe?: boolean;
  nom: string;
  service: string;
  /** Such as "08:30 · La Marsa". */
  horaire: string;
  badge: ReactNode;
  /** Who cancelled and why, or why it was refused. */
  info?: string | null;
  /** The stars the client gave, on a reviewed appointment. */
  avis?: { libelle: string; note: number; lecture: string } | null;
  actions?: ActionCarteRendezVous[];
};

// One of the client's appointments: date block, provider, service and time, status, then what they can do.
export function CarteRendezVous(p: CarteRendezVousProps) {
  return (
    <YStack padding="4" gap={14} borderRadius="5" backgroundColor="surface" {...OMBRE}>
      <XStack gap={14} alignItems="flex-start">
        <YStack
          width={56}
          height={62}
          borderRadius="4"
          backgroundColor={p.passe ? 'background-soft' : 'primary-soft'}
          alignItems="center"
          justifyContent="center"
          gap={3}
        >
          <Texte fontSize="1" fontWeight="600" color={p.passe ? 'color-muted' : 'on-primary-soft'}>
            {p.jour}
          </Texte>
          <Texte
            fontSize={22}
            lineHeight="22px"
            fontWeight="600"
            color={p.passe ? 'color-muted' : 'on-primary-soft'}
          >
            {p.numero}
          </Texte>
        </YStack>
        <YStack flex={1} minWidth={0} gap={3}>
          <Texte fontSize="5" fontWeight="600" numberOfLines={1}>
            {p.nom}
          </Texte>
          <Texte fontSize="4" color="color-muted" numberOfLines={2}>
            {p.service}
          </Texte>
          <XStack gap="1" alignItems="center">
            <Icone nom="schedule" taille={15} couleur="color-muted" />
            <Texte flex={1} fontSize="3" color="color-muted" numberOfLines={1}>
              {p.horaire}
            </Texte>
          </XStack>
        </YStack>
        {p.badge}
      </XStack>
      {p.info ? (
        <XStack gap={6} alignItems="flex-start">
          <Icone nom="info" taille={16} couleur="color-muted" />
          <Texte flex={1} fontSize="3" color="color-muted" numberOfLines={2}>
            {p.info}
          </Texte>
        </XStack>
      ) : null}
      {p.avis ? (
        <XStack gap="2" alignItems="center">
          <Texte fontSize="3" color="color-muted">
            {p.avis.libelle}
          </Texte>
          <Etoiles note={p.avis.note} libelle={p.avis.lecture} taille={15} />
        </XStack>
      ) : null}
      {p.actions && p.actions.length > 0 ? (
        <XStack gap="2">
          {p.actions.map((a) => (
            <YStack key={a.libelle} flex={1} minWidth={0}>
              <Bouton taille="sm" variante={a.variante} icone={a.icone} onPress={a.onPress}>
                {a.libelle}
              </Bouton>
            </YStack>
          ))}
        </XStack>
      ) : null}
    </YStack>
  );
}
