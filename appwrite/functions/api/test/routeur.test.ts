import { LONGUEUR_MAX } from '@fixa/core';
import { describe, expect, it } from 'vitest';
import { router } from '../src/routeur';
import { base, maintenant, reservation } from './donnees';

describe('router', () => {
  it('refuse un appel sans utilisateur', async () => {
    const r = await router(base(), null, 'POST', '/rendez-vous', reservation, maintenant);
    expect(r).toMatchObject({ statut: 401, corps: { ok: false, code: 'NON_AUTORISE' } });
  });

  it('repond 404 a une route inconnue', async () => {
    const appelant = { id: 'u-yasmine', labels: ['client'] };
    const r = await router(base(), appelant, 'GET', '/nimporte', {}, maintenant);
    expect(r).toMatchObject({ statut: 404, corps: { ok: false, code: 'REQUETE_INVALIDE' } });
  });

  it('refuse une reservation sans role', async () => {
    const appelant = { id: 'u-nouveau', labels: [] };
    const r = await router(base(), appelant, 'POST', '/rendez-vous', reservation, maintenant);
    expect(r).toMatchObject({ statut: 403, corps: { ok: false, code: 'NON_AUTORISE' } });
  });

  it('prend le role dans les labels, pas dans le corps', async () => {
    const db = base();
    const appelant = { id: 'u-yasmine', labels: ['client'] };
    const r = await router(db, appelant, 'POST', '/rendez-vous', reservation, maintenant);
    expect(r).toMatchObject({ statut: 200, corps: { ok: true } });
    if (!r.corps.ok) throw new Error('reservation refusee');
    const { rendezVousId } = r.corps.data as { rendezVousId: string };
    const karim = { id: 'u-karim', labels: ['fournisseur'] };
    const ok = await router(
      db,
      karim,
      'POST',
      `/rendez-vous/${rendezVousId}/accepter`,
      {},
      maintenant,
    );
    expect(ok).toMatchObject({ statut: 200, corps: { ok: true, data: { statut: 'CONFIRME' } } });
    const faux = await router(
      db,
      appelant,
      'POST',
      '/admin/fournisseurs/u-walid/valider',
      { role: 'admin' },
      maintenant,
    );
    expect(faux).toMatchObject({ statut: 403, corps: { code: 'NON_AUTORISE' } });
  });

  it('valide le corps avant d appeler la route', async () => {
    const appelant = { id: 'u-yasmine', labels: ['client'] };
    const r = await router(base(), appelant, 'POST', '/rendez-vous', { debut: 12 }, maintenant);
    expect(r).toMatchObject({ statut: 400, corps: { code: 'REQUETE_INVALIDE' } });
  });
});

describe('router, champs texte', () => {
  const long = (n: number) => 'x'.repeat(n);
  const nouveau = { id: 'u-nouveau', labels: [] as string[] };
  const yasmineAppel = { id: 'u-yasmine', labels: ['client'] };
  const karimAppel = { id: 'u-karim', labels: ['fournisseur'] };
  const corpsRole = {
    type: 'fournisseur',
    prenom: 'Walid',
    nom: 'Hammami',
    telephone: '+216 20 000 000',
    ville: 'Ariana',
  };

  it('refuse le role admin demande dans le corps', async () => {
    const db = base();
    const r = await router(
      db,
      nouveau,
      'POST',
      '/role',
      { ...corpsRole, type: 'admin' },
      maintenant,
    );
    expect(r).toMatchObject({ statut: 400, corps: { code: 'REQUETE_INVALIDE' } });
    expect(db.labels('u-nouveau')).toEqual([]);
  });

  it('accepte un prenom et un nom a la limite, qui tiennent dans le nom du fournisseur', async () => {
    const db = base();
    const corps = { ...corpsRole, prenom: long(LONGUEUR_MAX.prenom), nom: long(LONGUEUR_MAX.nom) };
    const r = await router(db, nouveau, 'POST', '/role', corps, maintenant);
    expect(r).toMatchObject({ statut: 200 });
    expect(String(db.table('fournisseurs').get('u-nouveau')?.nom).length).toBeLessThanOrEqual(128);
  });

  it('refuse un nom trop long avant toute ecriture', async () => {
    const db = base();
    const corps = { ...corpsRole, nom: long(LONGUEUR_MAX.nom + 1) };
    const r = await router(db, nouveau, 'POST', '/role', corps, maintenant);
    expect(r).toMatchObject({ statut: 400, corps: { code: 'REQUETE_INVALIDE' } });
    expect(db.table('profils').get('u-nouveau')).toBeUndefined();
    expect(db.labels('u-nouveau')).toEqual([]);
  });

  it('refuse une adresse ou une description trop longue sans occuper de creneau', async () => {
    for (const champ of ['adresse', 'description'] as const) {
      const db = base();
      const corps = { ...reservation, [champ]: long(LONGUEUR_MAX[champ] + 1) };
      const r = await router(db, yasmineAppel, 'POST', '/rendez-vous', corps, maintenant);
      expect([champ, r.statut]).toEqual([champ, 400]);
      expect(db.table('creneaux_occupes').rows).toHaveLength(0);
      expect(db.table('rendez_vous').rows).toHaveLength(0);
    }
  });

  it('repond 400 a une adresse vide quand le pro se deplace', async () => {
    const corps = { ...reservation, adresse: '' };
    const r = await router(base(), yasmineAppel, 'POST', '/rendez-vous', corps, maintenant);
    expect(r).toMatchObject({ statut: 400, corps: { ok: false, code: 'ADRESSE_REQUISE' } });
  });

  it('refuse un motif trop long sans changer le statut', async () => {
    const db = base();
    const r = await router(db, yasmineAppel, 'POST', '/rendez-vous', reservation, maintenant);
    if (!r.corps.ok) throw new Error('reservation refusee');
    const { rendezVousId } = r.corps.data as { rendezVousId: string };
    const refus = await router(
      db,
      karimAppel,
      'POST',
      `/rendez-vous/${rendezVousId}/refuser`,
      { motif: long(LONGUEUR_MAX.motif + 1) },
      maintenant,
    );
    expect(refus).toMatchObject({ statut: 400, corps: { code: 'REQUETE_INVALIDE' } });
    expect(db.table('rendez_vous').get(rendezVousId)).toMatchObject({ statut: 'EN_ATTENTE' });
  });
});
