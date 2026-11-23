import type { Langue } from '../domaine';
import { ar } from './ar';
import { en } from './en';
import { fr } from './fr';

type Large<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends (...args: infer A) => infer R
      ? (...args: A) => Large<R>
      : T extends readonly (infer U)[]
        ? readonly Large<U>[]
        : { readonly [K in keyof T]: Large<T[K]> };

export type Textes = Large<typeof fr>;

const dictionnaires: Record<Langue, Textes> = { fr, en, ar };
let courante: Langue = 'fr';

export function choisirLangue(l: Langue): void {
  courante = l;
}

export function langueCourante(): Langue {
  return courante;
}

function resoudre(chemin: readonly string[]): object {
  let v: unknown = dictionnaires[courante];
  for (const cle of chemin) v = (v as Record<string, unknown>)[cle];
  return v as object;
}

// A section is a view on a path, so `const t = textes.recherche` at module level still follows a switch.
function vue(chemin: readonly string[]): object {
  return new Proxy(
    {},
    {
      get: (_cible, cle) => {
        const v = Reflect.get(resoudre(chemin), cle);
        if (typeof cle === 'string' && v !== null && typeof v === 'object' && !Array.isArray(v)) {
          return vue([...chemin, cle]);
        }
        return v;
      },
      has: (_cible, cle) => Reflect.has(resoudre(chemin), cle),
      ownKeys: () => Reflect.ownKeys(resoudre(chemin)),
      getOwnPropertyDescriptor: (_cible, cle) => {
        const d = Reflect.getOwnPropertyDescriptor(resoudre(chemin), cle);
        return d ? { ...d, configurable: true } : undefined;
      },
    },
  );
}

export const textes = vue([]) as Textes;
