import { isWeb, XStack } from 'tamagui';
import { Texte } from './Texte';

export type SegmentsProps<T extends string> = {
  options: { valeur: T; libelle: string; compte?: number }[];
  valeur: T;
  onChange: (valeur: T) => void;
};

// A two or three way switch between views of one list, with an optional count pill per view.
export function Segments<T extends string>({ options, valeur, onChange }: SegmentsProps<T>) {
  return (
    <XStack padding="1" borderRadius="round" backgroundColor="background-soft" role="tablist">
      {options.map((o) => {
        const actif = o.valeur === valeur;
        return (
          <XStack
            key={o.valeur}
            role="tab"
            accessible={isWeb ? undefined : true}
            aria-selected={actif}
            flex={1}
            height={40}
            hitSlop={{ top: 2, bottom: 2 }}
            gap={6}
            borderRadius="round"
            alignItems="center"
            justifyContent="center"
            backgroundColor={actif ? 'surface' : 'transparent'}
            shadowColor={actif ? 'shadow-color' : 'transparent'}
            shadowOffset={{ width: 0, height: 1 }}
            shadowRadius={actif ? 3 : 0}
            cursor="pointer"
            onPress={() => onChange(o.valeur)}
          >
            <Texte
              fontSize="4"
              fontWeight={actif ? '600' : '500'}
              color={actif ? 'color' : 'color-muted'}
            >
              {o.libelle}
            </Texte>
            {o.compte ? (
              <XStack
                minWidth={20}
                height={20}
                paddingHorizontal={6}
                borderRadius="round"
                backgroundColor="primary"
                alignItems="center"
                justifyContent="center"
              >
                <Texte fontSize="1" fontWeight="600" color="on-primary">
                  {o.compte}
                </Texte>
              </XStack>
            ) : null}
          </XStack>
        );
      })}
    </XStack>
  );
}
