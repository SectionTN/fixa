import { z } from 'zod';
import { LONGUEUR_MIN_MOT_DE_PASSE, separerNom } from './auth';
import { textes } from './i18n/textes';
import { LONGUEUR_MAX } from './limites';

const CHIFFRES_TELEPHONE = 8;

export const champEmail = z
  .string()
  .trim()
  .pipe(z.email({ error: () => textes.auth.erreurs.emailInvalide }));

// The api splits the name into the profile's prenom and nom columns, so each part must fit its own.
const champNomComplet = z
  .string()
  .trim()
  .min(1, { error: () => textes.auth.erreurs.nomRequis })
  .refine(
    (complet) => {
      const { prenom, nom } = separerNom(complet);
      return prenom.length <= LONGUEUR_MAX.prenom && nom.length <= LONGUEUR_MAX.nom;
    },
    { error: () => textes.auth.erreurs.nomTropLong },
  );

export const schemaInscription = z.object({
  nomComplet: champNomComplet,
  email: champEmail,
  telephone: z
    .string()
    .regex(new RegExp(`^(\\d{${CHIFFRES_TELEPHONE}})?$`), {
      error: () => textes.auth.erreurs.telephoneInvalide,
    }),
  motDePasse: z
    .string()
    .min(LONGUEUR_MIN_MOT_DE_PASSE, { error: () => textes.auth.erreurs.motDePasseCourt }),
});

export const schemaConnexion = z.object({
  email: champEmail,
  motDePasse: z.string().min(1),
});

// Forms show one message under each field, the first one the schema raised.
export function erreursParChamp<T>(erreur: z.ZodError<T>): Partial<Record<keyof T, string>> {
  const { fieldErrors } = z.flattenError(erreur);
  const resultat: Partial<Record<keyof T, string>> = {};
  for (const [champ, messages] of Object.entries(fieldErrors) as [keyof T, string[]][]) {
    if (messages[0]) resultat[champ] = messages[0];
  }
  return resultat;
}
