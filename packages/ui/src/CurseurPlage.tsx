import { Slider } from '@tamagui/slider';

export type CurseurPlageProps = {
  min: number;
  max: number;
  pas: number;
  valeur: [number, number];
  onChange: (valeur: [number, number]) => void;
  libelles: [string, string];
};

const POUCE = 28;

// A two-thumb range on the unstyled slider, so no skin token reaches the native views.
export function CurseurPlage({ min, max, pas, valeur, onChange, libelles }: CurseurPlageProps) {
  return (
    <Slider
      min={min}
      max={max}
      step={pas}
      value={valeur}
      minStepsBetweenThumbs={1}
      onValueChange={(v: number[]) => onChange([v[0] ?? min, v[1] ?? max])}
      height={POUCE}
      justifyContent="center"
      marginHorizontal={POUCE / 2}
    >
      <Slider.Track height={6} borderRadius={9} backgroundColor="background-press">
        <Slider.TrackActive backgroundColor="primary" borderRadius={9} />
      </Slider.Track>
      {libelles.map((libelle, index) => (
        <Slider.Thumb
          key={libelle}
          index={index}
          size={POUCE}
          circular
          width={POUCE}
          height={POUCE}
          backgroundColor="surface"
          borderWidth={2}
          borderColor="primary"
          shadowColor="shadow-color"
          shadowOffset={{ width: 0, height: 1 }}
          shadowRadius={3}
          aria-label={libelle}
          hitSlop={8}
        />
      ))}
    </Slider>
  );
}
