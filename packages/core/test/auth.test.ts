import { describe, expect, it } from 'vitest';
import { forceMotDePasse, messageAuth, nonceDuJeton, roleDe, separerNom } from '../src/auth';
import { fr } from '../src/i18n/fr';

describe('roleDe', () => {
  it('lit le role dans les labels, admin d abord', () => {
    expect(roleDe(['client'])).toBe('client');
    expect(roleDe(['fournisseur'])).toBe('fournisseur');
    expect(roleDe(['client', 'admin'])).toBe('admin');
    expect(roleDe([])).toBeNull();
    expect(roleDe(['beta'])).toBeNull();
  });
});

describe('separerNom', () => {
  it('prend le premier mot comme prenom et le reste comme nom', () => {
    expect(separerNom('  Yasmine   Ben  Ali ')).toEqual({ prenom: 'Yasmine', nom: 'Ben Ali' });
    expect(separerNom('Karim')).toEqual({ prenom: 'Karim', nom: '' });
    expect(separerNom('   ')).toEqual({ prenom: '', nom: '' });
  });
});

describe('forceMotDePasse', () => {
  it('note de 0 (vide) a 4, sous 8 caracteres toujours faible', () => {
    expect(forceMotDePasse('')).toBe(0);
    expect(forceMotDePasse('Ab1!x')).toBe(1);
    expect(forceMotDePasse('abcdefgh')).toBe(1);
    expect(forceMotDePasse('abcdefg1')).toBe(2);
    expect(forceMotDePasse('Abcdefg1')).toBe(3);
    expect(forceMotDePasse('Abcdefg1!xyz')).toBe(4);
  });
});

describe('messageAuth', () => {
  it('traduit les erreurs Appwrite connues, une panne reseau sans type', () => {
    const e = fr.auth.erreurs;
    expect(messageAuth('user_invalid_credentials')).toBe(e.identifiants);
    expect(messageAuth('user_already_exists')).toBe(e.compteExiste);
    expect(messageAuth('user_password_mismatch')).toBe(e.identifiants);
    expect(messageAuth('general_argument_invalid')).toBe(fr.erreurs.REQUETE_INVALIDE);
    expect(messageAuth(undefined)).toBe(e.reseau);
  });
});

describe('nonceDuJeton', () => {
  const base64url = (texte: string) =>
    btoa(texte).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const jeton = (charge: unknown) =>
    `${base64url('{"alg":"RS256"}')}.${base64url(JSON.stringify(charge))}.signature`;

  it('lit le nonce dans une charge base64url sans remplissage', () => {
    const nonce = 'q~?>z~?>Q';
    const brut = jeton({ sub: '1', nonce });
    const charge = brut.split('.')[1] ?? '';
    expect(charge).toMatch(/[-_]/);
    expect(charge.length % 4).not.toBe(0);
    expect(nonceDuJeton(brut)).toBe(nonce);
  });

  it('rend undefined sans nonce ou pour un jeton illisible', () => {
    expect(nonceDuJeton(jeton({ sub: '1' }))).toBeUndefined();
    expect(nonceDuJeton(jeton({ sub: '1', nonce: 42 }))).toBeUndefined();
    expect(nonceDuJeton('pas-un-jeton')).toBeUndefined();
    expect(nonceDuJeton('a.%%%.c')).toBeUndefined();
    expect(nonceDuJeton(`a.${base64url('pas du json')}.c`)).toBeUndefined();
  });
});
