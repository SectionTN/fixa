import { describe, expect, it } from 'vitest';
import { publierAvis } from '../src/routes/avis';
import { base, ines, lundi0830, yasmine } from './donnees';

function avecRdv(statut: string) {
  const db = base();
  db.inserer('rendez_vous', [
    {
      $id: 'rdv-1',
      clientId: 'u-yasmine',
      fournisseurId: 'u-karim',
      clientNom: 'Yasmine Ben Ali',
      serviceTitre: 'Recherche et réparation de fuite',
      debut: lundi0830,
      statut,
      aAvis: false,
    },
  ]);
  return db;
}

const avis = {
  rendezVousId: 'rdv-1',
  note: 4,
  criteres: ['Ponctualité', 'Travail soigné'],
  commentaire: 'Rapide et propre.',
} as const;

describe('publierAvis', () => {
  it('publie un avis et met a jour la note du fournisseur', async () => {
    const db = avecRdv('TERMINE');
    const r = await publierAvis(db, yasmine, { ...avis, criteres: [...avis.criteres] });
    expect(r.ok).toBe(true);
    expect(db.table('avis').rows[0]).toMatchObject({
      rendezVousId: 'rdv-1',
      fournisseurId: 'u-karim',
      clientId: 'u-yasmine',
      clientNom: 'Yasmine Ben Ali',
      serviceTitre: 'Recherche et réparation de fuite',
      note: 4,
    });
    expect(db.table('rendez_vous').get('rdv-1')).toMatchObject({ aAvis: true });
    const karim = db.table('fournisseurs').get('u-karim');
    expect(karim).toMatchObject({ nbAvis: 129 });
    expect(karim?.noteMoyenne).toBeCloseTo(4.893, 3);
  });

  it('double avis', async () => {
    const db = avecRdv('TERMINE');
    const corps = { ...avis, criteres: [...avis.criteres] };
    const [a, b] = await Promise.all([
      publierAvis(db, yasmine, corps),
      publierAvis(db, yasmine, corps),
    ]);
    expect([a.ok, b.ok].sort()).toEqual([false, true]);
    expect([a, b].find((x) => !x.ok)).toMatchObject({ code: 'DEJA_EVALUE' });
    expect(db.table('avis').rows).toHaveLength(1);
    expect(db.table('fournisseurs').get('u-karim')).toMatchObject({ nbAvis: 129 });
  });

  it('une nouvelle tentative apres un avis ecrit a moitie debloque le rendez-vous sans recompter', async () => {
    const db = avecRdv('TERMINE');
    db.inserer('avis', [{ $id: 'deja', rendezVousId: 'rdv-1', clientId: 'u-yasmine', note: 4 }]);
    const corps = { ...avis, criteres: [...avis.criteres] };
    expect(await publierAvis(db, yasmine, corps)).toMatchObject({ code: 'DEJA_EVALUE' });
    expect(db.table('rendez_vous').get('rdv-1')).toMatchObject({ aAvis: true });
    expect(db.table('avis').rows).toHaveLength(1);
    expect(db.table('fournisseurs').get('u-karim')).toMatchObject({ nbAvis: 128 });
  });

  it('avis sur un rdv non termine', async () => {
    const db = avecRdv('CONFIRME');
    expect(await publierAvis(db, yasmine, { ...avis, criteres: [] })).toMatchObject({
      ok: false,
      code: 'TRANSITION_INVALIDE',
    });
  });

  it('refuse l avis d un autre client et une note hors bornes', async () => {
    const db = avecRdv('TERMINE');
    expect(await publierAvis(db, ines, { ...avis, criteres: [] })).toMatchObject({
      ok: false,
      code: 'NON_AUTORISE',
    });
    expect(await publierAvis(db, yasmine, { ...avis, note: 6 as 5, criteres: [] })).toMatchObject({
      ok: false,
      code: 'REQUETE_INVALIDE',
    });
    expect(await publierAvis(db, yasmine, { ...avis, criteres: ['Inconnu'] })).toMatchObject({
      ok: false,
      code: 'REQUETE_INVALIDE',
    });
  });

  it('accepte un commentaire de 500 caracteres, pas un de 501, comme le formulaire', async () => {
    const trop = { ...avis, criteres: [], commentaire: 'x'.repeat(501) };
    expect(await publierAvis(avecRdv('TERMINE'), yasmine, trop)).toMatchObject({
      ok: false,
      code: 'REQUETE_INVALIDE',
    });
    const juste = { ...avis, criteres: [], commentaire: 'x'.repeat(500) };
    expect(await publierAvis(avecRdv('TERMINE'), yasmine, juste)).toMatchObject({ ok: true });
  });
});
