import { describe, expect, it } from 'vitest';
import { changerStatut, libererCellules, reserver } from '../src/routes/rendezVous';
import { base, ines, karim, lundi0830, maintenant, reservation, yasmine } from './donnees';

async function reserve() {
  const db = base();
  const r = await reserver(db, yasmine, reservation, maintenant);
  if (!r.ok) throw new Error(r.code);
  return { db, id: r.data.rendezVousId };
}

describe('reserver', () => {
  it('cree le rendez-vous en attente avec ses cellules et ses permissions', async () => {
    const { db, id } = await reserve();
    expect(db.table('rendez_vous').get(id)).toMatchObject({
      clientId: 'u-yasmine',
      fournisseurId: 'u-karim',
      serviceTitre: 'Recherche et réparation de fuite',
      prix: 60,
      duree: 45,
      debut: lundi0830,
      statut: 'EN_ATTENTE',
      dateLimiteReponse: '2026-10-25T11:00:00.000Z',
      clientNom: 'Yasmine Ben Ali',
      clientTelephone: '+21620111222',
      fournisseurNom: 'Karim Ben Salah',
      aAvis: false,
    });
    expect(db.permissions('rendez_vous', id)).toEqual([
      'read("user:u-yasmine")',
      'read("user:u-karim")',
    ]);
    expect(db.table('creneaux_occupes').rows.map((c) => c.cellule)).toEqual([
      '2026-10-26T07:30:00.000Z',
      '2026-10-26T08:00:00.000Z',
    ]);
  });

  it('un seul gagnant pour le meme creneau', async () => {
    const db = base();
    const [a, b] = await Promise.all([
      reserver(db, yasmine, reservation, maintenant),
      reserver(db, ines, { ...reservation, adresse: 'Carthage' }, maintenant),
    ]);
    expect([a.ok, b.ok].sort()).toEqual([false, true]);
    expect([a, b].find((x) => !x.ok)).toMatchObject({
      code: 'CRENEAU_PRIS',
      message: "Ce créneau vient d'être pris. Choisissez-en un autre.",
    });
    expect(db.table('creneaux_occupes').rows).toHaveLength(2); // 45 min = 2 cellules, aucune cellule orpheline
    expect(db.table('rendez_vous').rows).toHaveLength(1);
  });

  it('refuse un creneau deja pris ou hors disponibilite', async () => {
    const { db } = await reserve();
    expect(await reserver(db, ines, reservation, maintenant)).toMatchObject({
      ok: false,
      code: 'CRENEAU_PRIS',
    });
    const dimanche = { ...reservation, debut: '2026-10-25T13:00:00.000Z' };
    expect(await reserver(db, ines, dimanche, maintenant)).toMatchObject({
      ok: false,
      code: 'CRENEAU_PRIS',
    });
  });

  it('fournisseur non valide', async () => {
    const db = base();
    const r = await reserver(
      db,
      yasmine,
      { ...reservation, fournisseurId: 'u-walid', serviceId: 's-walid' },
      maintenant,
    );
    expect(r).toMatchObject({ ok: false, code: 'FOURNISSEUR_INDISPONIBLE' });
    expect(db.table('rendez_vous').rows).toHaveLength(0);
    expect(db.table('creneaux_occupes').rows).toHaveLength(0);
  });

  it('exige une adresse quand le pro se deplace, sans prendre de cellule', async () => {
    const db = base();
    expect(
      await reserver(db, yasmine, { ...reservation, adresse: '   ' }, maintenant),
    ).toMatchObject({ ok: false, code: 'ADRESSE_REQUISE' });
    expect(db.table('rendez_vous').rows).toHaveLength(0);
    expect(db.table('creneaux_occupes').rows).toHaveLength(0);
  });

  it("garde l'adresse sans espaces autour, et aucune quand le client va chez le pro", async () => {
    const db = base();
    const chez = await reserver(
      db,
      yasmine,
      { ...reservation, adresse: '  12 rue Hédi Nouira, La Marsa ' },
      maintenant,
    );
    const magasin = await reserver(
      db,
      ines,
      { ...reservation, serviceId: 's-magasin', debut: '2026-10-26T09:00:00.000Z' },
      maintenant,
    );
    if (!chez.ok || !magasin.ok) throw new Error('reservation refusee');
    expect(db.table('rendez_vous').get(chez.data.rendezVousId)).toMatchObject({
      adresse: '12 rue Hédi Nouira, La Marsa',
    });
    expect(db.table('rendez_vous').get(magasin.data.rendezVousId)).toMatchObject({
      adresse: '',
    });
  });

  it('reserve sans adresse quand le client va chez le pro', async () => {
    const db = base();
    const r = await reserver(
      db,
      yasmine,
      { ...reservation, serviceId: 's-magasin', adresse: '' },
      maintenant,
    );
    expect(r).toMatchObject({ ok: true });
  });

  it('refuse un service d un autre fournisseur et un appelant non client', async () => {
    const db = base();
    expect(
      await reserver(db, yasmine, { ...reservation, serviceId: 's-walid' }, maintenant),
    ).toMatchObject({ ok: false, code: 'REQUETE_INVALIDE' });
    expect(await reserver(db, karim, reservation, maintenant)).toMatchObject({
      ok: false,
      code: 'NON_AUTORISE',
    });
  });
});

describe('changerStatut', () => {
  it('accepter apres une annulation du client', async () => {
    const { db, id } = await reserve();
    const t1 = new Date('2026-10-25T09:30:00.000Z');
    const t2 = new Date('2026-10-25T09:31:00.000Z');
    expect(await changerStatut(db, yasmine, id, 'annuler', {}, t1)).toMatchObject({
      ok: true,
      data: { statut: 'ANNULE' },
    });
    expect(await changerStatut(db, karim, id, 'accepter', {}, t2)).toMatchObject({
      ok: false,
      code: 'TRANSITION_INVALIDE',
    });
    expect(db.table('rendez_vous').get(id)).toMatchObject({
      statut: 'ANNULE',
      annulePar: 'client',
    });
    expect(db.table('creneaux_occupes').rows).toHaveLength(0);
  });

  it('accepter apres la limite meme si le worker est en retard', async () => {
    const { db, id } = await reserve();
    const r = await changerStatut(db, karim, id, 'accepter', {}, new Date('2026-10-25T11:01:00Z'));
    expect(r).toMatchObject({ ok: false, code: 'DELAI_DEPASSE' });
    expect(db.table('rendez_vous').get(id)).toMatchObject({ statut: 'EN_ATTENTE' });
  });

  it('accepter garde les cellules, refuser les libere', async () => {
    const { db, id } = await reserve();
    expect(await changerStatut(db, karim, id, 'accepter', {}, maintenant)).toMatchObject({
      ok: true,
      data: { statut: 'CONFIRME' },
    });
    expect(db.table('creneaux_occupes').rows).toHaveLength(2);

    const autre = await reserve();
    await changerStatut(autre.db, karim, autre.id, 'refuser', { motif: 'Absent' }, maintenant);
    expect(autre.db.table('rendez_vous').get(autre.id)).toMatchObject({
      statut: 'REFUSE',
      motif: 'Absent',
    });
    expect(autre.db.table('creneaux_occupes').rows).toHaveLength(0);
  });

  it('marque une annulation tardive sur le rendez-vous, jamais sur le profil modifiable', async () => {
    const { db, id } = await reserve();
    const profilAvant = { ...db.table('profils').get('u-yasmine') };
    await changerStatut(db, yasmine, id, 'annuler', {}, new Date('2026-10-26T06:45:00Z'));
    expect(db.table('rendez_vous').get(id)).toMatchObject({
      annulationTardive: true,
      annulePar: 'client',
    });
    expect(db.table('profils').get('u-yasmine')).toEqual(profilAvant);
  });

  it.each([
    ['annuler puis accepter', true],
    ['accepter puis annuler', false],
  ])(
    '%s au meme instant: un seul gagne et les cellules suivent le statut',
    async (_, annuleDabord) => {
      const { db, id } = await reserve();
      const annuler = () => changerStatut(db, yasmine, id, 'annuler', {}, maintenant);
      const accepter = () => changerStatut(db, karim, id, 'accepter', {}, maintenant);
      const [premier, second] = annuleDabord
        ? await Promise.all([annuler(), accepter()])
        : await Promise.all([accepter(), annuler()]);
      expect([premier.ok, second.ok]).toEqual([true, false]);
      expect(second).toMatchObject({ code: 'TRANSITION_INVALIDE' });
      const statut = db.table('rendez_vous').get(id)?.statut;
      const cellules = db.table('creneaux_occupes').rows.length;
      expect({ statut, cellules }).toEqual(
        annuleDabord ? { statut: 'ANNULE', cellules: 0 } : { statut: 'CONFIRME', cellules: 2 },
      );
      if (!annuleDabord) {
        expect(await reserver(db, ines, reservation, maintenant)).toMatchObject({
          code: 'CRENEAU_PRIS',
        });
      }
    },
  );

  it('refuser et annuler au meme instant ne finit jamais en erreur serveur', async () => {
    const { db, id } = await reserve();
    const resultats = await Promise.all([
      changerStatut(db, karim, id, 'refuser', {}, maintenant),
      changerStatut(db, yasmine, id, 'annuler', {}, maintenant),
    ]);
    expect(resultats.filter((r) => r.ok)).toHaveLength(1);
    expect(db.table('creneaux_occupes').rows).toHaveLength(0);
  });

  it('liberer deux fois en meme temps ne leve pas d erreur', async () => {
    const { db, id } = await reserve();
    await Promise.all([libererCellules(db, id), libererCellules(db, id)]);
    expect(db.table('creneaux_occupes').rows).toHaveLength(0);
  });

  it('une nouvelle tentative libere les cellules restees apres un echec', async () => {
    const { db, id } = await reserve();
    await changerStatut(db, yasmine, id, 'annuler', {}, maintenant);
    db.inserer('creneaux_occupes', [
      { $id: 'reste', fournisseurId: 'u-karim', cellule: lundi0830, rendezVousId: id },
    ]);
    expect(await changerStatut(db, yasmine, id, 'annuler', {}, maintenant)).toMatchObject({
      code: 'TRANSITION_INVALIDE',
    });
    expect(db.table('creneaux_occupes').rows).toHaveLength(0);
    expect(await reserver(db, ines, reservation, maintenant)).toMatchObject({ ok: true });
  });

  it('rendez-vous inconnu', async () => {
    const db = base();
    expect(await changerStatut(db, karim, 'nope', 'accepter', {}, maintenant)).toMatchObject({
      ok: false,
      code: 'INTROUVABLE',
    });
  });
});
