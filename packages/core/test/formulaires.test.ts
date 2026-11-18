import { describe, expect, it } from 'vitest';
import {
  champEmail,
  erreursParChamp,
  schemaConnexion,
  schemaInscription,
} from '../src/formulaires';
import { fr } from '../src/i18n/fr';
import { LONGUEUR_MAX } from '../src/limites';

const e = fr.auth.erreurs;
const valide = {
  nomComplet: 'Yasmine Ben Ali',
  email: ' yasmine@fixa.test ',
  telephone: '22345678',
  motDePasse: 'SectionTN',
};

const erreurs = (valeurs: Record<string, string>) => {
  const r = schemaInscription.safeParse(valeurs);
  return r.success ? {} : erreursParChamp(r.error);
};

describe('schemaInscription', () => {
  it('accepte un formulaire complet et rend les valeurs nettoyees', () => {
    const r = schemaInscription.safeParse(valide);
    expect(r.success).toBe(true);
    expect(r.data?.email).toBe('yasmine@fixa.test');
  });

  it('accepte un telephone vide, refuse un numero incomplet', () => {
    expect(erreurs({ ...valide, telephone: '' })).toEqual({});
    expect(erreurs({ ...valide, telephone: '2234' })).toEqual({ telephone: e.telephoneInvalide });
  });

  it('donne un message par champ, le premier seulement', () => {
    expect(
      erreurs({ nomComplet: '  ', email: 'yasmine', telephone: '', motDePasse: 'court' }),
    ).toEqual({
      nomComplet: e.nomRequis,
      email: e.emailInvalide,
      motDePasse: e.motDePasseCourt,
    });
  });

  it('refuse un prenom ou un nom plus long que la colonne du profil', () => {
    const long = 'a'.repeat(LONGUEUR_MAX.prenom + 1);
    expect(erreurs({ ...valide, nomComplet: long })).toEqual({ nomComplet: e.nomTropLong });
    expect(
      erreurs({ ...valide, nomComplet: `Yasmine ${'b'.repeat(LONGUEUR_MAX.nom + 1)}` }),
    ).toEqual({
      nomComplet: e.nomTropLong,
    });
    expect(erreurs({ ...valide, nomComplet: `${'a'.repeat(LONGUEUR_MAX.prenom)} Ben` })).toEqual(
      {},
    );
  });
});

describe('champEmail', () => {
  it('accepte une adresse ordinaire, refuse le reste', () => {
    expect(champEmail.safeParse(' yasmine@fixa.test ').success).toBe(true);
    expect(champEmail.safeParse('yasmine@fixa').success).toBe(false);
    expect(champEmail.safeParse('yasmine fixa.test').success).toBe(false);
    expect(champEmail.safeParse('').success).toBe(false);
  });
});

describe('schemaConnexion', () => {
  it('veut un e-mail valide et un mot de passe non vide', () => {
    expect(schemaConnexion.safeParse({ email: 'salma@fixa.test', motDePasse: 'x' }).success).toBe(
      true,
    );
    expect(schemaConnexion.safeParse({ email: 'salma@fixa.test', motDePasse: '' }).success).toBe(
      false,
    );
    expect(schemaConnexion.safeParse({ email: 'salma', motDePasse: 'x' }).success).toBe(false);
  });
});
