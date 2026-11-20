import { Fragment } from 'react';
import { isWeb, XStack } from 'tamagui';
import { Icone } from './Icone';
import { Texte } from './Texte';

export type EtapesProps = {
  etapes: readonly string[];
  /** Index of the current step, from 0. */
  courante: number;
  /** Read by screen readers, such as "Étape 2 sur 3 : Créneau". */
  libelle: string;
};

// A stepper: done steps show a check, the current one is filled, the next ones are outlined.
export function Etapes({ etapes, courante, libelle }: EtapesProps) {
  return (
    <XStack alignItems="center" gap={8} accessible={isWeb ? undefined : true} aria-label={libelle}>
      {etapes.map((nom, i) => {
        const faite = i < courante;
        const active = i === courante;
        return (
          <Fragment key={nom}>
            {i > 0 ? (
              <XStack
                flex={1}
                minWidth={10}
                height={2}
                borderRadius={1}
                backgroundColor={i <= courante ? 'primary' : 'border-color'}
              />
            ) : null}
            <XStack gap={7} alignItems="center">
              <XStack
                width={24}
                height={24}
                borderRadius="round"
                alignItems="center"
                justifyContent="center"
                backgroundColor={faite || active ? 'primary' : 'transparent'}
                borderWidth={faite || active ? 0 : 1.5}
                borderColor="border-strong"
              >
                {faite ? (
                  <Icone nom="check" taille={15} couleur="on-primary" />
                ) : (
                  <Texte
                    fontSize="2"
                    fontWeight="600"
                    color={active ? 'on-primary' : 'color-muted'}
                  >
                    {i + 1}
                  </Texte>
                )}
              </XStack>
              <Texte
                fontSize="3"
                fontWeight={active ? '600' : '500'}
                color={active ? 'color' : 'color-muted'}
                numberOfLines={1}
              >
                {nom}
              </Texte>
            </XStack>
          </Fragment>
        );
      })}
    </XStack>
  );
}
