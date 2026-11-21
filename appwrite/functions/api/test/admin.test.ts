import { describe, expect, it } from 'vitest';
import { deciderFournisseur } from '../src/routes/admin';
import { choisirRole } from '../src/routes/role';
import { base, maintenant, salma, yasmine } from './donnees';

describe('deciderFournisseur', () => {
  it('valider un fournisseur', async () => {
    const db = base();
    expect(await deciderFournisseur(db, yasmine, 'u-walid', 'valider')).toMatchObject({
      ok: false,
      code: 'NON_AUTORISE',
    });
    expect(
      await deciderFournisseur(db, salma, 'u-walid', 'valider', undefined, maintenant),
    ).toEqual({ ok: true, data: { statutVerification: 'VALIDE' } });
    expect(db.table('fournisseurs').get('u-walid')).toMatchObject({
      statutVerification: 'VALIDE',
      visible: true,
      finEssai: '2027-01-23T09:00:00.000Z',
    });
  });

  it('refuser un fournisseur avec un motif', async () => {
    const db = base();
    await deciderFournisseur(db, salma, 'u-walid', 'refuser', 'Documents illisibles');
    expect(db.table('fournisseurs').get('u-walid')).toMatchObject({
      statutVerification: 'REFUSE',
      visible: false,
      motifRefus: 'Documents illisibles',
    });
    expect(await deciderFournisseur(db, salma, 'inconnu', 'valider')).toMatchObject({
      ok: false,
      code: 'INTROUVABLE',
    });
  });

  it('ne decide qu un dossier en attente, une seconde decision ne change rien', async () => {
    const db = base();
    await deciderFournisseur(db, salma, 'u-walid', 'valider', undefined, maintenant);
    const plusTard = new Date(maintenant.getTime() + 86_400_000);
    for (const decision of ['valider', 'refuser'] as const) {
      expect(
        await deciderFournisseur(db, salma, 'u-walid', decision, 'Trop tard', plusTard),
      ).toMatchObject({ ok: false, code: 'DOSSIER_TRAITE' });
    }
    expect(db.table('fournisseurs').get('u-walid')).toMatchObject({
      statutVerification: 'VALIDE',
      visible: true,
      finEssai: '2027-01-23T09:00:00.000Z',
    });
  });
});

describe('choisirRole', () => {
  const corps = { prenom: 'Sonia', nom: 'Gharbi', telephone: '+21622000111', ville: 'Ariana' };

  it('cree un profil client et pose le label', async () => {
    const db = base();
    expect(await choisirRole(db, 'u-nouveau', { type: 'client', ...corps })).toEqual({
      ok: true,
      data: { role: 'client' },
    });
    expect(db.table('profils').get('u-nouveau')).toMatchObject({
      prenom: 'Sonia',
      ville: 'Ariana',
    });
    expect(db.permissions('profils', 'u-nouveau')).toEqual([
      'read("user:u-nouveau")',
      'update("user:u-nouveau")',
    ]);
    expect(db.labels('u-nouveau')).toEqual(['client']);
    expect(db.table('fournisseurs').get('u-nouveau')).toBeUndefined();
  });

  it('cree un fournisseur en attente et invisible', async () => {
    const db = base();
    await choisirRole(db, 'u-nouveau', { type: 'fournisseur', ...corps });
    expect(db.table('fournisseurs').get('u-nouveau')).toMatchObject({
      nom: 'Sonia Gharbi',
      statutVerification: 'EN_ATTENTE',
      visible: false,
    });
    expect(db.permissions('profils', 'u-nouveau')).toContain('read("any")');
    expect(db.labels('u-nouveau')).toEqual(['fournisseur']);
  });

  it('ne change pas un role deja pose', async () => {
    const db = base();
    expect(await choisirRole(db, 'u-yasmine', { type: 'fournisseur', ...corps })).toMatchObject({
      ok: false,
      code: 'TRANSITION_INVALIDE',
    });
    expect(await choisirRole(db, 'u-salma', { type: 'client', ...corps })).toMatchObject({
      ok: false,
      code: 'TRANSITION_INVALIDE',
    });
  });
});
