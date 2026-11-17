import type { Acteur } from '@fixa/core';
import { fauxDb } from '@fixa/fn-commun/faux';

export const yasmine: Acteur = { id: 'u-yasmine', role: 'client' };
export const ines: Acteur = { id: 'u-ines', role: 'client' };
export const karim: Acteur = { id: 'u-karim', role: 'fournisseur' };
export const salma: Acteur = { id: 'u-salma', role: 'admin' };

// Dimanche 25 octobre 2026, 10:00 a Tunis.
export const maintenant = new Date('2026-10-25T09:00:00.000Z');

export const lundi0830 = '2026-10-26T07:30:00.000Z';

export function base() {
  const db = fauxDb({
    creneaux_occupes: [['fournisseurId', 'cellule']],
    avis: [['rendezVousId']],
  });
  db.inserer('fournisseurs', [
    {
      $id: 'u-karim',
      nom: 'Karim Ben Salah',
      categorieId: 'plomberie',
      ville: 'La Marsa',
      latitude: 36.8795,
      longitude: 10.3207,
      prixMin: 50,
      statutVerification: 'VALIDE',
      noteMoyenne: 4.9,
      nbAvis: 128,
      visible: true,
      finEssai: null,
      finAbonnement: null,
      motifRefus: null,
    },
    {
      $id: 'u-walid',
      nom: 'Walid Hammami',
      categorieId: 'electricite',
      ville: 'Ariana',
      latitude: 36.8625,
      longitude: 10.1956,
      prixMin: 40,
      statutVerification: 'EN_ATTENTE',
      noteMoyenne: 0,
      nbAvis: 0,
      visible: false,
      finEssai: null,
      finAbonnement: null,
      motifRefus: null,
    },
  ]);
  db.inserer('services', [
    {
      $id: 's-fuite',
      fournisseurId: 'u-karim',
      titre: 'Recherche et réparation de fuite',
      description: '',
      typePrix: 'FIXE',
      prix: 60,
      duree: 45,
      estVisible: true,
    },
    {
      $id: 's-walid',
      fournisseurId: 'u-walid',
      titre: 'Dépannage électrique',
      description: '',
      typePrix: 'A_PARTIR_DE',
      prix: 40,
      duree: 60,
      estVisible: true,
    },
  ]);
  db.inserer(
    'disponibilites',
    ['u-karim', 'u-walid'].flatMap((fournisseurId) => [
      { $id: `${fournisseurId}-matin`, fournisseurId, jour: 1, debut: '08:00', fin: '12:00' },
      { $id: `${fournisseurId}-aprem`, fournisseurId, jour: 1, debut: '14:00', fin: '18:00' },
    ]),
  );
  db.inserer('profils', [
    { $id: 'u-yasmine', prenom: 'Yasmine', nom: 'Ben Ali', telephone: '+21620111222' },
    { $id: 'u-ines', prenom: 'Ines', nom: 'Trabelsi', telephone: '+21620333444' },
  ]);
  db.utilisateurs([
    { $id: 'u-yasmine', labels: ['client'] },
    { $id: 'u-ines', labels: ['client'] },
    { $id: 'u-karim', labels: ['fournisseur'] },
    { $id: 'u-walid', labels: ['fournisseur'] },
    { $id: 'u-salma', labels: ['admin'] },
    { $id: 'u-nouveau', labels: [] },
  ]);
  return db;
}

export const reservation = {
  fournisseurId: 'u-karim',
  serviceId: 's-fuite',
  debut: lundi0830,
  adresse: '12 rue Hédi Nouira, La Marsa',
  description: 'Fuite sous l evier',
};
