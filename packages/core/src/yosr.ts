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

const SALUT: readonly string[] = [
  'bonjour',
  'bonsoir',
  'salut',
  'coucou',
  'aslema',
  'asslema',
  'ahla',
  'salam',
  'hello',
  'hi',
  'hey',
  'مرحبا',
  'السلام',
  'اهلا',
  'عسلامة',
];

const MERCI: readonly string[] = [
  'merci',
  'thanks',
  'thank',
  'choukran',
  'chokran',
  'shukran',
  'saha',
  'y3aychek',
  'شكرا',
  'يعيشك',
  'يعطيك',
];

const PRIX: readonly string[] = [
  'pas cher',
  'moins cher',
  'economi',
  'budget',
  'rkhis',
  'cheap',
  'رخيص',
  'ارخص',
];

// Common short and Arabic forms of the seeded cities, so "fi l'marsa" or "المرسى" finds La Marsa.
const ALIAS_VILLES: Record<string, readonly string[]> = {
  'La Marsa': ['marsa', 'المرسى'],
  Ariana: ['aryana', 'أريانة'],
  Carthage: ['qartaj', 'قرطاج'],
  'Le Kram': ['kram', 'الكرم'],
  'Sidi Bou Saïd': ['sidi bou', 'سيدي بوسعيد', 'سيدي بو سعيد'],
  Ennasr: ['nasr', 'النصر'],
  'Lac 2': ['lac', 'البحيرة'],
};

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

// Optimal string alignment distance: insertions, deletions, substitutions and swaps of two neighbours.
function distance(a: string, b: string): number {
  let avant: number[] = [];
  let precedente = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const ligne = [i];
    for (let j = 1; j <= b.length; j++) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(
        (precedente[j] ?? 0) + 1,
        (ligne[j - 1] ?? 0) + 1,
        (precedente[j - 1] ?? 0) + cout,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, (avant[j - 2] ?? 0) + 1);
      }
      ligne.push(v);
    }
    avant = precedente;
    precedente = ligne;
  }
  return precedente[b.length] ?? 0;
}

const LONGUEUR_FLOUE = 5;
const EXACT = 2;
const FLOU = 1;

// Arabic matches anywhere (attached al-, wa-). Latin matches a word start, or one typo from it when long enough.
function prise(message: string, mots: readonly string[], mot: string): number {
  const cle = normaliserMessage(mot);
  if (ARABE.test(cle) || cle.includes(' ')) return message.includes(cle) ? EXACT : 0;
  if (mots.some((m) => m.startsWith(cle))) return EXACT;
  if (cle.length < LONGUEUR_FLOUE) return 0;
  const tailles = [cle.length - 1, cle.length, cle.length + 1];
  const proche = mots.some((m) =>
    tailles.some((n) => m.length >= n && distance(m.slice(0, n), cle) <= 1),
  );
  return proche ? FLOU : 0;
}

// Small talk matches whole words only, so "hi" never fires on "hier".
function dit(message: string, mots: readonly string[], liste: readonly string[]): boolean {
  return liste.some((mot) => {
    const cle = normaliserMessage(mot);
    return ARABE.test(cle) || cle.includes(' ') ? message.includes(cle) : mots.includes(cle);
  });
}

export type Intention = 'salut' | 'merci' | null;
export type Analyse = {
  categorieId: string | null;
  urgence: boolean;
  /** The client asked for a low price. */
  prix: boolean;
  intention: Intention;
};

function meilleureCategorie(message: string, mots: readonly string[], niveau: number) {
  let categorieId: string | null = null;
  let meilleur = 0;
  for (const [id, liste] of Object.entries(MOTS)) {
    const score = liste.filter((mot) => prise(message, mots, mot) >= niveau).length;
    if (score > meilleur) {
      meilleur = score;
      categorieId = id;
    }
  }
  return categorieId;
}

// Yosr's guided mode: category, urgency, price and small talk. A typo counts only when no word matches exactly.
export function analyserMessage(texte: string): Analyse {
  const message = normaliserMessage(texte);
  const mots = message.split(' ');
  const categorieId =
    meilleureCategorie(message, mots, EXACT) ?? meilleureCategorie(message, mots, FLOU);
  const intention = dit(message, mots, MERCI)
    ? 'merci'
    : dit(message, mots, SALUT)
      ? 'salut'
      : null;
  return {
    categorieId,
    urgence: URGENCE.some((mot) => prise(message, mots, mot) === EXACT),
    prix: PRIX.some((mot) => prise(message, mots, mot) === EXACT),
    intention,
  };
}

// The city a message names, among the given ones and the seeded ones, by its name or a short or Arabic form.
export function villeCitee(texte: string, villes: readonly string[]): string | null {
  const message = ` ${normaliserMessage(texte)} `;
  for (const ville of new Set([...villes, ...Object.keys(ALIAS_VILLES)])) {
    const formes = [ville, ...(ALIAS_VILLES[ville] ?? [])].map(normaliserMessage);
    const trouvee = formes.some((f) =>
      ARABE.test(f) ? message.includes(f) : message.includes(` ${f} `),
    );
    if (trouvee) return ville;
  }
  return null;
}
