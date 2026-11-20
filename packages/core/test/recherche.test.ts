import { describe, expect, it } from 'vitest';
import type { Categorie, Disponibilite, Fournisseur, Service } from '../src/domaine';
import { fr } from '../src/i18n/fr';
import {
  correspondRecherche,
  FILTRES_VIDES,
  type FournisseurAffiche,
  filtrerFournisseurs,
  formatDistance,
  formatDuree,
  initiales,
  interpreterRecherche,
  libelleCreneau,
  libelleDispo,
  libelleDispoDes,
  mieuxNotes,
  nbFiltresActifs,
  nomCourt,
  preparerFournisseurs,
  prixDepart,
} from '../src/recherche';
import { versUtc } from '../src/temps';

// Wednesday 18 November 2026, 10:00 in Tunis.
const maintenant = new Date('2026-11-18T09:00:00Z');

function fournisseur(id: string, champs: Partial<Fournisseur> = {}): Fournisseur {
  return {
    $id: id,
    nom: id,
    categorieId: 'plomberie',
    ville: 'La Marsa',
    latitude: 36.87,
    longitude: 10.32,
    prixMin: 40,
    statutVerification: 'VALIDE',
    noteMoyenne: 4.5,
    nbAvis: 10,
    visible: true,
    finEssai: null,
    finAbonnement: null,
    motifRefus: null,
    ...champs,
  };
}

function service(fournisseurId: string, duree: number, champs: Partial<Service> = {}): Service {
  return {
    $id: `${fournisseurId}-${duree}`,
    fournisseurId,
    titre: 'Service',
    description: '',
    typePrix: 'FIXE',
    prix: 50,
    duree,
    estVisible: true,
    aDomicile: true,
    ...champs,
  };
}

// Monday to Saturday, 08:00-12:00 and 14:00-18:00.
const semaine = (fournisseurId: string): Disponibilite[] =>
  ([1, 2, 3, 4, 5, 6] as const).flatMap((jour) => [
    { fournisseurId, jour, debut: '08:00', fin: '12:00' },
    { fournisseurId, jour, debut: '14:00', fin: '18:00' },
  ]);

const affiche = (id: string, champs: Partial<FournisseurAffiche> = {}): FournisseurAffiche => ({
  ...fournisseur(id),
  specialite: null,
  distanceKm: null,
  prochainCreneau: null,
  joursLibres: [],
  prixDepart: null,
  ...champs,
});

describe('formats', () => {
  it('met zero et un au singulier, comme le francais', () => {
    expect(fr.recherche.nbResultats(0)).toBe('0 résultat');
    expect(fr.recherche.nbPros(1)).toBe('1 pro');
    expect(fr.recherche.filtres.voir(0)).toBe('Voir 0 résultat');
    expect(fr.recherche.filtres.voir(2)).toBe('Voir 2 résultats');
  });

  it('ecrit une distance avec une decimale et une virgule', () => {
    expect(formatDistance(1.234)).toBe('1,2 km');
    expect(formatDistance(0.81)).toBe('0,8 km');
    expect(formatDistance(11.76)).toBe('11,8 km');
  });

  it('ecrit une duree en minutes ou en heures', () => {
    expect(formatDuree(45)).toBe('45 min');
    expect(formatDuree(120)).toBe('2 h');
    expect(formatDuree(90)).toBe('1 h 30');
  });

  it('raccourcit le nom de la personne qui laisse un avis', () => {
    expect(nomCourt('Mehdi Karoui')).toBe('Mehdi K.');
    expect(nomCourt('Karim Ben Salah')).toBe('Karim B.');
    expect(nomCourt('Salma')).toBe('Salma');
  });

  it('prend deux initiales et saute le titre Dr', () => {
    expect(initiales('Karim Ben Salah')).toBe('KB');
    expect(initiales('Dr Amira Gharbi')).toBe('AG');
    expect(initiales('Salon Leïla')).toBe('SL');
    expect(initiales('Nadia')).toBe('N');
  });
});

describe('libelles de disponibilite', () => {
  // 00:30 in Tunis on Thursday 19, while the UTC date is still the 18th.
  const apresMinuit = new Date('2026-11-18T23:30:00Z');

  it('compare les dates de Tunis, pas celles de l appareil', () => {
    expect(libelleCreneau(versUtc('2026-11-19', '08:00'), apresMinuit)).toBe("Aujourd'hui 08:00");
    expect(libelleCreneau(versUtc('2026-11-20', '08:00'), apresMinuit)).toBe('Demain 08:00');
    expect(libelleCreneau(versUtc('2026-11-21', '09:00'), apresMinuit)).toBe('Sam. 09:00');
  });

  it('nomme le jour sur la carte et sur le profil', () => {
    expect(libelleDispo(versUtc('2026-11-18', '17:00'), maintenant)).toBe("Dispo aujourd'hui");
    expect(libelleDispo(versUtc('2026-11-19', '08:00'), maintenant)).toBe('Dispo demain');
    expect(libelleDispo(versUtc('2026-11-20', '08:00'), maintenant)).toBe('Dispo vendredi');
    expect(libelleDispoDes(versUtc('2026-11-19', '08:00'), maintenant)).toBe(
      'Dispo demain dès 08:00',
    );
  });
});

describe('prixDepart', () => {
  it('omet dès pour un seul service a prix fixe', () => {
    expect(prixDepart([service('a', 45, { prix: 60 })])).toBe('60 DT');
  });

  it('ajoute dès des que le prix peut monter', () => {
    expect(prixDepart([service('a', 45, { prix: 60 }), service('a', 30, { prix: 45 })])).toBe(
      'dès 45 DT',
    );
    expect(prixDepart([service('a', 45, { typePrix: 'A_PARTIR_DE', prix: 45 })])).toBe('dès 45 DT');
  });

  it('dit sur devis sans prix, rien sans service', () => {
    expect(prixDepart([service('a', 45, { typePrix: 'SUR_DEVIS', prix: null })])).toBe('Sur devis');
    expect(prixDepart([])).toBeNull();
  });
});

describe('preparerFournisseurs', () => {
  const chez = { lat: 36.88, lng: 10.325 };
  const creneaux = (id: string, occupees: string[] = []) => ({
    disponibilites: semaine(id),
    conges: [],
    occupees,
  });

  it('cherche le prochain creneau avec le service le plus court de chaque pro', () => {
    const [karim, sami] = preparerFournisseurs({
      fournisseurs: [fournisseur('karim'), fournisseur('sami')],
      services: [service('karim', 45), service('karim', 30), service('sami', 45)],
      creneaux: { karim: creneaux('karim'), sami: creneaux('sami') },
      specialites: { karim: 'Plombier' },
      position: chez,
      maintenant,
    });
    // 11:30 is the first start 90 min after 10:00, and 45 min from 11:30 passes noon.
    expect(karim?.prochainCreneau).toBe(versUtc('2026-11-18', '11:30'));
    expect(sami?.prochainCreneau).toBe(versUtc('2026-11-18', '14:00'));
    expect(karim?.specialite).toBe('Plombier');
    expect(sami?.specialite).toBeNull();
    expect(karim?.distanceKm).toBeCloseTo(1.2, 0);
  });

  it('ne calcule pas de distance pour un pro encore place en 0, 0', () => {
    const [nouveau] = preparerFournisseurs({
      fournisseurs: [fournisseur('nouveau', { latitude: 0, longitude: 0 })],
      services: [service('nouveau', 30)],
      creneaux: { nouveau: creneaux('nouveau') },
      specialites: {},
      position: chez,
      maintenant,
    });
    expect(nouveau?.distanceKm).toBeNull();
  });

  it('ne lit que les cases prises du pro concerne', () => {
    const [karim, sami] = preparerFournisseurs({
      fournisseurs: [fournisseur('karim'), fournisseur('sami')],
      services: [service('karim', 30), service('sami', 30)],
      creneaux: {
        karim: creneaux('karim', [versUtc('2026-11-18', '11:30')]),
        sami: creneaux('sami'),
      },
      specialites: {},
      position: null,
      maintenant,
    });
    expect(karim?.prochainCreneau).toBe(versUtc('2026-11-18', '14:00'));
    expect(sami?.prochainCreneau).toBe(versUtc('2026-11-18', '11:30'));
    expect(karim?.distanceKm).toBeNull();
  });

  it('liste les jours libres sur sept jours, dimanche exclu', () => {
    const [karim] = preparerFournisseurs({
      fournisseurs: [fournisseur('karim')],
      services: [service('karim', 30)],
      creneaux: { karim: creneaux('karim') },
      specialites: {},
      position: null,
      maintenant,
    });
    expect(karim?.joursLibres).toEqual([
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-23',
      '2026-11-24',
    ]);
  });

  it('laisse un pro sans service sans creneau ni prix', () => {
    const [vide] = preparerFournisseurs({
      fournisseurs: [fournisseur('vide')],
      services: [],
      creneaux: { vide: creneaux('vide') },
      specialites: {},
      position: null,
      maintenant,
    });
    expect(vide?.prochainCreneau).toBeNull();
    expect(vide?.joursLibres).toEqual([]);
    expect(vide?.prixDepart).toBeNull();
  });
});

describe('filtrerFournisseurs', () => {
  const liste = [
    affiche('karim', { noteMoyenne: 4.9, prixMin: 45, joursLibres: ['2026-11-18', '2026-11-19'] }),
    affiche('sami', { noteMoyenne: 4.8, prixMin: 35, ville: 'Lac 2', joursLibres: ['2026-11-19'] }),
    affiche('hedi', { noteMoyenne: 4.7, prixMin: 45, joursLibres: ['2026-11-18'] }),
    affiche('ennour', { noteMoyenne: 4.6, prixMin: null, joursLibres: ['2026-11-21'] }),
  ];
  const ids = (l: FournisseurAffiche[]) => l.map((f) => f.$id);

  it('garde tout sans filtre', () => {
    expect(ids(filtrerFournisseurs(liste, FILTRES_VIDES, maintenant))).toEqual([
      'karim',
      'sami',
      'hedi',
      'ennour',
    ]);
    expect(nbFiltresActifs(FILTRES_VIDES)).toBe(0);
  });

  it('garde 4,8 et plus', () => {
    const f = { ...FILTRES_VIDES, noteMin: 4.8 };
    expect(ids(filtrerFournisseurs(liste, f, maintenant))).toEqual(['karim', 'sami']);
    expect(nbFiltresActifs(f)).toBe(1);
  });

  it('filtre la ville et le prix de depart, sans prix exclu', () => {
    const f = { ...FILTRES_VIDES, ville: 'La Marsa', prixPlafond: 45 };
    expect(ids(filtrerFournisseurs(liste, f, maintenant))).toEqual(['karim', 'hedi']);
    expect(nbFiltresActifs(f)).toBe(2);
    const plancher = { ...FILTRES_VIDES, prixPlancher: 40 };
    expect(ids(filtrerFournisseurs(liste, plancher, maintenant))).toEqual(['karim', 'hedi']);
  });

  it('demain garde un pro libre aujourd hui et demain', () => {
    const demain = { ...FILTRES_VIDES, dispo: 'demain' as const };
    expect(ids(filtrerFournisseurs(liste, demain, maintenant))).toEqual(['karim', 'sami']);
    const aujourdhui = { ...FILTRES_VIDES, dispo: 'aujourdhui' as const };
    expect(ids(filtrerFournisseurs(liste, aujourdhui, maintenant))).toEqual(['karim', 'hedi']);
    const semaine = { ...FILTRES_VIDES, dispo: 'semaine' as const };
    expect(ids(filtrerFournisseurs(liste, semaine, maintenant))).toHaveLength(4);
  });
});

describe('mieuxNotes', () => {
  const liste = [
    affiche('amira', { noteMoyenne: 4.9, nbAvis: 212, distanceKm: 6.2 }),
    affiche('karim', { noteMoyenne: 4.9, nbAvis: 128, distanceKm: 1.2 }),
    affiche('nadia', { noteMoyenne: 5, nbAvis: 53, distanceKm: 0.8 }),
    affiche('leila', { noteMoyenne: 4.8, nbAvis: 187, distanceKm: 14.5 }),
    affiche('sami', { noteMoyenne: 4.8, nbAvis: 96, distanceKm: 2.8 }),
    affiche('mansour', { noteMoyenne: 4.5, nbAvis: 38, distanceKm: 11.8 }),
  ];

  it('classe par note puis par distance', () => {
    expect(mieuxNotes(liste, 5).map((f) => f.$id)).toEqual([
      'nadia',
      'karim',
      'amira',
      'sami',
      'leila',
    ]);
  });

  it('departage par nombre d avis sans position', () => {
    const sansPosition = liste.map((f) => ({ ...f, distanceKm: null }));
    expect(mieuxNotes(sansPosition, 3).map((f) => f.$id)).toEqual(['nadia', 'amira', 'karim']);
  });
});

describe('interpreterRecherche', () => {
  const categorie = (id: string, nom: string): Categorie => ({
    $id: id,
    nom,
    icone: 'plumbing',
    couleur: 'cat1',
    ordre: 1,
    estActive: true,
  });
  const categories = [
    categorie('plomberie', 'Plomberie'),
    categorie('medecins', 'Médecins'),
    categorie('coiffure', 'Coiffure'),
  ];

  it('reconnait un metier ou une categorie, accents ignores', () => {
    expect(interpreterRecherche('plombier', categories)).toEqual({ categorieIds: ['plomberie'] });
    expect(interpreterRecherche('Medecin', categories)).toEqual({ categorieIds: ['medecins'] });
    expect(interpreterRecherche('  coiffeur ', categories)).toEqual({
      categorieIds: ['coiffure'],
    });
    expect(interpreterRecherche('plomb', categories)).toEqual({ categorieIds: ['plomberie'] });
  });

  it('cherche un nom sinon, a partir de trois lettres', () => {
    expect(interpreterRecherche('Karim', categories)).toEqual({ nom: 'Karim' });
    expect(interpreterRecherche('ka', categories)).toBeNull();
  });
});

describe('correspondRecherche', () => {
  const plomberie: Categorie = {
    $id: 'plomberie',
    nom: 'Plomberie',
    icone: 'plumbing',
    couleur: 'cat1',
    ordre: 1,
    estActive: true,
  };
  const hedi = affiche('hedi', { nom: 'Hédi Jaziri', specialite: 'Plombier' });

  it('cherche dans le nom, la specialite et les mots du metier, accents ignores', () => {
    expect(correspondRecherche(hedi, '', [plomberie])).toBe(true);
    expect(correspondRecherche(hedi, 'hedi', [plomberie])).toBe(true);
    expect(correspondRecherche(hedi, 'plomb', [plomberie])).toBe(true);
    expect(correspondRecherche(hedi, 'fuite', [plomberie])).toBe(true);
    expect(correspondRecherche(hedi, 'karim', [plomberie])).toBe(false);
  });
});
