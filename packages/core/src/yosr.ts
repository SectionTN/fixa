// Words per seeded category, in French, Tunisian Derja (Latin and Arabic script), Arabic and English.
const MOTS: Record<string, readonly string[]> = {
  plomberie: [
    'plomb',
    'fuite',
    'fuit',
    'coul',
    'robinet',
    'douche',
    'evier',
    'tuyau',
    'canalisation',
    'toilette',
    'chauffe-eau',
    'eau',
    'leak',
    'pipe',
    'plumb',
    'blombi',
    'sbay',
    'سباك',
    'تسرب',
    'ماء',
    'دوش',
    'روبيني',
    'بلومبي',
  ],
  electricite: [
    'electri',
    'courant',
    'prise',
    'lumiere',
    'disjoncteur',
    'ampoule',
    'trisian',
    'tricien',
    'dhaw',
    'dhow',
    'power',
    'light',
    'socket',
    'كهرب',
    'ضو',
    'تريسيان',
  ],
  medecins: [
    'medecin',
    'docteur',
    'malade',
    'fievre',
    'douleur',
    'toux',
    'tbib',
    'mridh',
    'marid',
    'skhana',
    'doctor',
    'sick',
    'fever',
    'طبيب',
    'مريض',
    'سخانة',
    'دكتور',
  ],
  mecanique: [
    'voiture',
    'mecani',
    'garage',
    'moteur',
    'pneu',
    'frein',
    'batterie',
    'karhba',
    'krahb',
    'engine',
    'mechanic',
    'كرهبة',
    'سيارة',
    'ميكانيك',
  ],
  coiffure: [
    'coiff',
    'cheveu',
    'coupe',
    'barb',
    'brushing',
    'hajjem',
    'haircut',
    'hair',
    'حجام',
    'حلاق',
    'شعر',
  ],
  menage: [
    'menage',
    'nettoy',
    'repassage',
    'tandhif',
    'nadhf',
    'cleaning',
    'clean',
    'تنظيف',
    'نظافة',
  ],
  clim: [
    'clim',
    'climatis',
    'chauffage',
    'klimatiz',
    'mokayef',
    'air condition',
    'مكيف',
    'كليماتيزور',
    'تكييف',
  ],
};

const URGENCE: readonly string[] = [
  'urgen',
  'vite',
  'fort',
  'inond',
  'tout de suite',
  'fissa',
  'tawa',
  '3ajel',
  'emergency',
  'asap',
  'عاجل',
  'فيسع',
  'توة',
];

const ARABE = /[؀-ۿ]/;

export function normaliserMessage(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}-]+/gu, ' ')
    .trim();
}

// Arabic words take attached prefixes (al-, wa-), so they match anywhere. Latin words match a word start.
function contient(message: string, mots: readonly string[], mot: string): boolean {
  const cle = normaliserMessage(mot);
  if (ARABE.test(cle) || cle.includes(' ')) return message.includes(cle);
  return mots.some((m) => m.startsWith(cle));
}

export type Analyse = { categorieId: string | null; urgence: boolean };

// Yosr's guided mode: the category a message is about, and whether it sounds urgent.
export function analyserMessage(texte: string): Analyse {
  const message = normaliserMessage(texte);
  const mots = message.split(' ');
  let categorieId: string | null = null;
  let meilleur = 0;
  for (const [id, liste] of Object.entries(MOTS)) {
    const score = liste.filter((mot) => contient(message, mots, mot)).length;
    if (score > meilleur) {
      meilleur = score;
      categorieId = id;
    }
  }
  return { categorieId, urgence: URGENCE.some((mot) => contient(message, mots, mot)) };
}
