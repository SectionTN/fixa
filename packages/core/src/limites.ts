// Longest text each form field accepts. Every limit fits its Appwrite column, which the seed's config test checks.
export const LONGUEUR_MAX = {
  prenom: 60,
  nom: 60,
  telephone: 32,
  ville: 64,
  adresse: 256,
  description: 300,
  motif: 500,
} as const;
