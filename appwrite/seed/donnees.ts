import {
  type Avis,
  ajouterJours,
  ajouterMinutes,
  type Categorie,
  type Conge,
  type CreneauOccupe,
  cellules,
  type Disponibilite,
  dateLimiteReponse,
  dateLocale,
  type Fournisseur,
  type JourSemaine,
  PAS_MIN,
  type Profil,
  type RendezVous,
  type Role,
  type Service,
  type StatutRendezVous,
  type Transition,
  versUtc,
} from '@fixa/core';

export type Lignes = {
  categories: Categorie;
  profils: Profil;
  fournisseurs: Fournisseur;
  services: Service;
  disponibilites: Disponibilite & { $id: string };
  conges: Conge & { $id: string };
  creneaux_occupes: CreneauOccupe;
  rendez_vous: RendezVous;
  avis: Avis;
  transitions: Transition;
};
export type NomTable = keyof Lignes;
export type LigneSemee<T> = { ligne: T; permissions: string[] };
export type Compte = { $id: string; email: string; nom: string; labels: string[] };
export type Donnees = {
  comptes: Compte[];
  tables: { [K in NomTable]: LigneSemee<Lignes[K]>[] };
};

const lire = (id: string) => `read("user:${id}")`;
const modifier = (id: string) => `update("user:${id}")`;
const libre = <T>(ligne: T): LigneSemee<T> => ({ ligne, permissions: [] });

const YASMINE = {
  prenom: 'Yasmine',
  nom: 'Ben Ali',
  telephone: '+216 22 345 678',
  adresse: '12 rue Hédi Nouira, La Marsa',
  latitude: 36.88,
  longitude: 10.325,
};

const CATEGORIES: Categorie[] = [
  ['plomberie', 'Plomberie', 'plumbing', 'cat1'],
  ['electricite', 'Électricité', 'electrical_services', 'cat2'],
  ['medecins', 'Médecins', 'stethoscope', 'cat3'],
  ['mecanique', 'Mécanique', 'car_repair', 'cat4'],
  ['coiffure', 'Coiffure', 'content_cut', 'cat5'],
  ['menage', 'Ménage', 'cleaning_services', 'cat6'],
  ['clim', 'Clim', 'ac_unit', 'cat6'],
].map(([$id, nom, icone, couleur], i) => ({
  $id: $id as string,
  nom: nom as string,
  icone: icone as string,
  couleur: couleur as string,
  ordre: i + 1,
  estActive: true,
}));

type Pro = {
  id: string;
  prenom: string;
  nom: string;
  enseigne: string;
  specialite: string;
  categorieId: string;
  ville: string;
  position: [number, number];
  note: number;
  nbAvis: number;
  description: string;
  services: Omit<Service, 'fournisseurId' | 'estVisible'>[];
};

const s = (
  $id: string,
  titre: string,
  typePrix: Service['typePrix'],
  prix: number | null,
  duree: number,
  description = '',
) => ({ $id, titre, typePrix, prix, duree, description });

const PROS: Pro[] = [
  {
    id: 'u-karim',
    prenom: 'Karim',
    nom: 'Ben Salah',
    enseigne: 'Karim Ben Salah',
    specialite: 'Plombier',
    categorieId: 'plomberie',
    ville: 'La Marsa',
    position: [36.87022, 10.3193],
    note: 4.9,
    nbAvis: 128,
    description:
      "Plombier à La Marsa depuis 2013 : fuites, débouchage, chauffe-eau, salle de bain. J'explique le problème et le prix avant d'intervenir.",
    services: [
      s('s-karim-fuite', 'Recherche et réparation de fuite', 'FIXE', 60, 45),
      s('s-karim-debouchage', 'Débouchage de canalisation', 'FIXE', 50, 30),
      s('s-karim-robinetterie', 'Remplacement de robinetterie', 'A_PARTIR_DE', 45, 45),
      s('s-karim-chauffe-eau', 'Installation de chauffe-eau', 'FIXE', 120, 120),
    ],
  },
  {
    id: 'u-amira',
    prenom: 'Amira',
    nom: 'Gharbi',
    enseigne: 'Dr Amira Gharbi',
    specialite: 'Médecin généraliste',
    categorieId: 'medecins',
    ville: 'Lac 2',
    position: [36.8435, 10.273],
    note: 4.9,
    nbAvis: 212,
    description: 'Médecine générale, suivi des familles et certificats.',
    services: [s('s-amira-consultation', 'Consultation', 'FIXE', 60, 30)],
  },
  {
    id: 'u-sami',
    prenom: 'Sami',
    nom: 'Trabelsi',
    enseigne: 'Sami Trabelsi',
    specialite: 'Plombier',
    categorieId: 'plomberie',
    ville: 'Le Kram',
    position: [36.8552, 10.31954],
    note: 4.8,
    nbAvis: 96,
    description: 'Plomberie générale et dépannage rapide.',
    services: [s('s-sami-fuite', 'Réparation de fuite', 'A_PARTIR_DE', 35, 45)],
  },
  {
    id: 'u-hedi',
    prenom: 'Hédi',
    nom: 'Jaziri',
    enseigne: 'Hédi Jaziri',
    specialite: 'Plombier',
    categorieId: 'plomberie',
    ville: 'Carthage',
    position: [36.85254, 10.33105],
    note: 4.7,
    nbAvis: 64,
    description: 'Installation et réparation, sanitaires et chauffe-eau.',
    services: [s('s-hedi-fuite', 'Réparation de fuite', 'A_PARTIR_DE', 45, 45)],
  },
  {
    id: 'u-ennour',
    prenom: 'Ennour',
    nom: 'Plomberie',
    enseigne: 'Plomberie Ennour',
    specialite: 'Plombier',
    categorieId: 'plomberie',
    ville: 'Sidi Bou Saïd',
    position: [36.85244, 10.3539],
    note: 4.6,
    nbAvis: 41,
    description: 'Équipe de plombiers, débouchage et rénovation.',
    services: [s('s-ennour-debouchage', 'Débouchage de canalisation', 'A_PARTIR_DE', 40, 30)],
  },
  {
    id: 'u-leila',
    prenom: 'Leïla',
    nom: 'Salon',
    enseigne: 'Salon Leïla',
    specialite: 'Coiffeuse',
    categorieId: 'coiffure',
    ville: 'Ennasr',
    position: [36.861, 10.164],
    note: 4.8,
    nbAvis: 187,
    description: 'Coiffure femme, brushing et couleur.',
    services: [s('s-leila-brushing', 'Brushing', 'FIXE', 25, 45)],
  },
  {
    id: 'u-mansour',
    prenom: 'Mansour',
    nom: 'Garage',
    enseigne: 'Garage Mansour',
    specialite: 'Mécanicien',
    categorieId: 'mecanique',
    ville: 'Ariana',
    position: [36.8665, 10.193],
    note: 4.5,
    nbAvis: 38,
    description: 'Entretien et réparation toutes marques.',
    services: [s('s-mansour-vidange', 'Vidange', 'FIXE', 70, 60)],
  },
  {
    id: 'u-nadia',
    prenom: 'Nadia',
    nom: 'Mejri',
    enseigne: 'Nadia Mejri',
    specialite: 'Aide ménagère',
    categorieId: 'menage',
    ville: 'La Marsa',
    position: [36.88623, 10.3295],
    note: 5,
    nbAvis: 53,
    description: 'Ménage à domicile, repassage.',
    services: [
      s('s-nadia-heure', "Ménage à l'heure", 'FIXE', 15, 60),
      s('s-nadia-complet', 'Ménage complet (3 h)', 'FIXE', 45, 180),
    ],
  },
  {
    id: 'u-walid',
    prenom: 'Walid',
    nom: 'Hammami',
    enseigne: 'Walid Hammami',
    specialite: 'Électricien',
    categorieId: 'electricite',
    ville: 'Ariana',
    position: [36.86, 10.196],
    note: 0,
    nbAvis: 0,
    description: 'Installation électrique et dépannage.',
    services: [s('s-walid-depannage', 'Dépannage électrique', 'A_PARTIR_DE', 40, 60)],
  },
];

const CLIENTS = [
  { id: 'u-salma', prenom: 'Salma', nom: 'Gharsallah', label: 'admin' },
  { id: 'u-yasmine', prenom: YASMINE.prenom, nom: YASMINE.nom, label: 'client' },
  { id: 'u-mehdi', prenom: 'Mehdi', nom: 'Karoui', label: 'client' },
  { id: 'u-rania', prenom: 'Rania', nom: 'Sfar', label: 'client' },
];

// Every relative date hangs on the 30-minute cell that holds `maintenant`, so two runs in it write the same rows.
export function donnees(maintenant: Date): Donnees {
  const pas = PAS_MIN * 60_000;
  const ancre = new Date(Math.floor(maintenant.getTime() / pas) * pas).toISOString();
  const aujourdhui = dateLocale(ancre);
  const a = (jours: number, heure: string) => versUtc(ajouterJours(aujourdhui, jours), heure);

  const comptes: Compte[] = [
    ...CLIENTS.map((c) => ({
      $id: c.id,
      email: `${c.prenom.toLowerCase()}@fixa.test`,
      nom: `${c.prenom} ${c.nom}`,
      labels: [c.label],
    })),
    ...PROS.map((p) => ({
      $id: p.id,
      email: `${p.id.slice(2)}@fixa.test`,
      nom: p.enseigne,
      labels: ['fournisseur'],
    })),
  ];

  const profils: LigneSemee<Profil>[] = [
    ...CLIENTS.map((c) => ({
      ligne: {
        $id: c.id,
        prenom: c.prenom,
        nom: c.nom,
        telephone: c.id === 'u-yasmine' ? YASMINE.telephone : '',
        langue: 'fr' as const,
        ville: c.id === 'u-yasmine' ? 'La Marsa' : '',
        specialites: [],
        description: '',
        adresse: c.id === 'u-yasmine' ? YASMINE.adresse : '',
        latitude: c.id === 'u-yasmine' ? YASMINE.latitude : null,
        longitude: c.id === 'u-yasmine' ? YASMINE.longitude : null,
      },
      permissions: [lire(c.id), modifier(c.id)],
    })),
    ...PROS.map((p) => ({
      ligne: {
        $id: p.id,
        prenom: p.prenom,
        nom: p.nom,
        telephone: '',
        langue: 'fr' as const,
        ville: p.ville,
        specialites: [p.specialite],
        description: p.description,
        adresse: '',
        latitude: null,
        longitude: null,
      },
      permissions: [lire(p.id), modifier(p.id), 'read("any")'],
    })),
  ];

  const services: Service[] = PROS.flatMap((p) =>
    p.services.map((sv) => ({ ...sv, fournisseurId: p.id, estVisible: true })),
  );

  const fournisseurs: Fournisseur[] = PROS.map((p) => {
    const valide = p.id !== 'u-walid';
    const prix = services
      .filter((sv) => sv.fournisseurId === p.id && sv.prix !== null)
      .map((sv) => sv.prix as number);
    return {
      $id: p.id,
      nom: p.enseigne,
      categorieId: p.categorieId,
      ville: p.ville,
      latitude: p.position[0],
      longitude: p.position[1],
      prixMin: Math.min(...prix),
      statutVerification: valide ? 'VALIDE' : 'EN_ATTENTE',
      noteMoyenne: p.note,
      nbAvis: p.nbAvis,
      visible: valide,
      finEssai: valide && p.id !== 'u-amira' ? a(60, '23:59') : null,
      finAbonnement: p.id === 'u-amira' ? a(25, '23:59') : null,
      motifRefus: null,
    };
  });

  const disponibilites = PROS.flatMap((p) =>
    ([1, 2, 3, 4, 5, 6] as JourSemaine[]).flatMap((jour) => [
      {
        $id: `d-${p.id.slice(2)}-${jour}-matin`,
        fournisseurId: p.id,
        jour,
        debut: '08:00',
        fin: '12:00',
      },
      {
        $id: `d-${p.id.slice(2)}-${jour}-aprem`,
        fournisseurId: p.id,
        jour,
        debut: '14:00',
        fin: '18:00',
      },
    ]),
  );

  const conges = [
    {
      $id: 'c-mansour-annuel',
      fournisseurId: 'u-mansour',
      debut: ajouterJours(aujourdhui, 10),
      fin: ajouterJours(aujourdhui, 12),
      motif: 'Congé annuel',
    },
  ];

  const nomClient = (id: string) => comptes.find((c) => c.$id === id)?.nom ?? '';
  const service = (id: string) => services.find((sv) => sv.$id === id) as Service;
  const rdv = (
    $id: string,
    clientId: string,
    serviceId: string,
    debut: string,
    statut: StatutRendezVous,
    extra: Partial<RendezVous> = {},
  ): RendezVous => {
    const sv = service(serviceId);
    const creation = ajouterMinutes(debut, statut === 'EN_ATTENTE' ? 0 : -24 * 60);
    const cree = statut === 'EN_ATTENTE' ? new Date(ancre) : new Date(creation);
    return {
      $id,
      clientId,
      fournisseurId: sv.fournisseurId,
      serviceId,
      serviceTitre: sv.titre,
      typePrix: sv.typePrix,
      prix: sv.prix,
      duree: sv.duree,
      debut,
      adresse: clientId === 'u-yasmine' ? YASMINE.adresse : 'La Marsa',
      description: '',
      estUrgent: false,
      source: 'APP',
      statut,
      dateLimiteReponse: dateLimiteReponse(cree, new Date(debut)).toISOString(),
      motif: null,
      annulePar: null,
      annulationTardive: false,
      clientNom: nomClient(clientId),
      clientTelephone: clientId === 'u-yasmine' ? YASMINE.telephone : '',
      fournisseurNom: fournisseurs.find((f) => f.$id === sv.fournisseurId)?.nom ?? '',
      aAvis: false,
      dernierStatutNotifie: statut,
      ...extra,
    };
  };

  const rendezVous: RendezVous[] = [
    rdv('r-yasmine-attente', 'u-yasmine', 's-karim-fuite', a(1, '08:30'), 'EN_ATTENTE', {
      source: 'CHATBOT',
      estUrgent: true,
      description: "Fuite sous l'évier de la cuisine, l'eau coule en continu.",
    }),
    rdv('r-yasmine-confirme', 'u-yasmine', 's-amira-consultation', a(2, '10:00'), 'CONFIRME'),
    rdv(
      'r-yasmine-en-cours',
      'u-yasmine',
      's-nadia-complet',
      ajouterMinutes(ancre, -60),
      'CONFIRME',
    ),
    rdv('r-yasmine-termine', 'u-yasmine', 's-leila-brushing', a(-3, '10:00'), 'TERMINE'),
    rdv('r-yasmine-note', 'u-yasmine', 's-nadia-complet', a(-28, '09:00'), 'TERMINE', {
      aAvis: true,
    }),
    rdv('r-yasmine-annule', 'u-yasmine', 's-mansour-vidange', a(-2, '09:00'), 'ANNULE', {
      annulePar: 'fournisseur',
      motif: 'Pièce indisponible',
    }),
    rdv('r-yasmine-refuse', 'u-yasmine', 's-hedi-fuite', a(-7, '14:00'), 'REFUSE', {
      motif: 'Pas disponible à cette heure',
    }),
    rdv('r-yasmine-expire', 'u-yasmine', 's-sami-fuite', a(-6, '09:00'), 'EXPIRE'),
    rdv('r-mehdi-fuite', 'u-mehdi', 's-karim-fuite', a(-3, '08:00'), 'TERMINE', { aAvis: true }),
    rdv('r-rania-chauffe-eau', 'u-rania', 's-karim-chauffe-eau', a(-36, '14:00'), 'TERMINE', {
      aAvis: true,
    }),
  ];

  const avisDe = (
    $id: string,
    rendezVousId: string,
    criteres: string[],
    commentaire: string,
  ): Avis => {
    const r = rendezVous.find((x) => x.$id === rendezVousId) as RendezVous;
    return {
      $id,
      rendezVousId,
      fournisseurId: r.fournisseurId,
      clientId: r.clientId,
      clientNom: r.clientNom,
      serviceTitre: r.serviceTitre,
      note: 5,
      criteres,
      commentaire,
    };
  };

  const avis: Avis[] = [
    avisDe(
      'a-yasmine-nadia',
      'r-yasmine-note',
      ['Ponctualité', 'Propreté'],
      'Travail impeccable, je recommande.',
    ),
    avisDe(
      'a-mehdi-karim',
      'r-mehdi-fuite',
      ['Ponctualité', 'Travail soigné'],
      "Arrivé à l'heure, fuite trouvée et réparée en 30 minutes. Le prix annoncé a été respecté.",
    ),
    avisDe(
      'a-rania-karim',
      'r-rania-chauffe-eau',
      ['Travail soigné', 'Accueil'],
      "Très pro et propre. Il a pris le temps d'expliquer avant de commencer.",
    ),
  ];

  // The statuses each seeded booking went through after EN_ATTENTE, and who moved it.
  const etapes = (r: RendezVous): [StatutRendezVous, Role][] => {
    switch (r.statut) {
      case 'EN_ATTENTE':
        return [];
      case 'CONFIRME':
      case 'REFUSE':
        return [[r.statut, 'fournisseur']];
      case 'EXPIRE':
        return [['EXPIRE', 'systeme']];
      case 'ANNULE':
        return [
          ['CONFIRME', 'fournisseur'],
          ['ANNULE', r.annulePar ?? 'client'],
        ];
      case 'TERMINE':
        return [
          ['CONFIRME', 'fournisseur'],
          ['TERMINE', 'fournisseur'],
        ];
    }
  };
  const transitions: Transition[] = rendezVous.flatMap((r) => {
    let de: StatutRendezVous = 'EN_ATTENTE';
    return etapes(r).map(([vers, par]) => {
      const t = { $id: `${r.$id}.${de}`, rendezVousId: r.$id, de, vers, par };
      de = vers;
      return t;
    });
  });

  const creneaux: CreneauOccupe[] = rendezVous
    .filter((r) => r.statut === 'EN_ATTENTE' || r.statut === 'CONFIRME')
    .flatMap((r) =>
      cellules(r.debut, r.duree).map((cellule) => ({
        $id: `${r.$id}-${Date.parse(cellule) / 60_000}`,
        fournisseurId: r.fournisseurId,
        cellule,
        rendezVousId: r.$id,
      })),
    );

  return {
    comptes,
    tables: {
      categories: CATEGORIES.map(libre),
      profils,
      fournisseurs: fournisseurs.map(libre),
      services: services.map(libre),
      disponibilites: disponibilites.map(libre),
      conges: conges.map(libre),
      creneaux_occupes: creneaux.map(libre),
      rendez_vous: rendezVous.map((r) => ({
        ligne: r,
        permissions: [lire(r.clientId), lire(r.fournisseurId)],
      })),
      avis: avis.map(libre),
      transitions: transitions.map(libre),
    },
  };
}
