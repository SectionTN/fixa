import { describe, expect, it } from 'vitest';
import { analyserMessage, normaliserMessage, villeCitee } from '../src/yosr';

describe('analyserMessage', () => {
  it('reconnait une fuite en francais', () => {
    expect(analyserMessage("ma douche fuit, il me faut quelqu'un demain matin")).toMatchObject({
      categorieId: 'plomberie',
      urgence: false,
    });
  });

  it('comprend la derja en lettres latines et en arabe', () => {
    expect(analyserMessage('3andi fuite fel douche').categorieId).toBe('plomberie');
    expect(analyserMessage('الضو مقصوص في الدار').categorieId).toBe('electricite');
    expect(analyserMessage('el karhba ma temchich').categorieId).toBe('mecanique');
  });

  it("comprend l'anglais et l'arabe", () => {
    expect(analyserMessage('I need a haircut').categorieId).toBe('coiffure');
    expect(analyserMessage('أحتاج طبيب للطفل').categorieId).toBe('medecins');
  });

  it("repere l'urgence", () => {
    expect(analyserMessage("Urgent, ça coule fort sous l'évier")).toMatchObject({
      categorieId: 'plomberie',
      urgence: true,
    });
  });

  it('ne devine rien sans mot connu', () => {
    expect(analyserMessage('quelle heure est-il')).toEqual({
      categorieId: null,
      urgence: false,
      prix: false,
      intention: null,
    });
    expect(analyserMessage('beaucoup de travail au bureau').categorieId).toBeNull();
  });
});

describe('normaliserMessage', () => {
  it('retire accents, ponctuation et variantes arabes', () => {
    expect(normaliserMessage('Électricité !')).toBe('electricite');
    expect(normaliserMessage('أإآ ة')).toBe('ااا ه');
  });
});

describe('Yosr, lecture plus fine', () => {
  it('tolere une faute de frappe', () => {
    expect(analyserMessage('il me faut un plmobier').categorieId).toBe('plomberie');
    expect(analyserMessage('un electrcien svp').categorieId).toBe('electricite');
    expect(analyserMessage('je cherche un medcin').categorieId).toBe('medecins');
  });

  it('prefere un mot exact a une faute', () => {
    expect(analyserMessage('ça coule partout').categorieId).toBe('plomberie');
  });

  it("ne voit pas d'urgence dans un mot proche", () => {
    expect(analyserMessage("je n'ai pas d'argent").urgence).toBe(false);
  });

  it('comprend les salutations et les remerciements', () => {
    expect(analyserMessage('Bonjour !').intention).toBe('salut');
    expect(analyserMessage('aslema').intention).toBe('salut');
    expect(analyserMessage('مرحبا').intention).toBe('salut');
    expect(analyserMessage('merci beaucoup').intention).toBe('merci');
    expect(analyserMessage('شكرا').intention).toBe('merci');
    expect(analyserMessage('hier soir').intention).toBeNull();
  });

  it('repere un petit budget', () => {
    expect(analyserMessage('un plombier pas cher').prix).toBe(true);
    expect(analyserMessage('cheap haircut').prix).toBe(true);
    expect(analyserMessage('un plombier').prix).toBe(false);
  });
});

describe('villeCitee', () => {
  const villes = ['La Marsa', 'Ariana', 'Carthage'];

  it('trouve une ville par son nom, sa forme courte ou son nom arabe', () => {
    expect(villeCitee('un plombier à La Marsa', villes)).toBe('La Marsa');
    expect(villeCitee("fi l'marsa", villes)).toBe('La Marsa');
    expect(villeCitee('طبيب في المرسى', villes)).toBe('La Marsa');
    expect(villeCitee('coiffeur ariana', villes)).toBe('Ariana');
  });

  it('connait une ville seedee meme sans pro dans la liste', () => {
    expect(villeCitee('electricien au Kram', [])).toBe('Le Kram');
  });

  it('ignore un mot qui contient seulement le nom', () => {
    expect(villeCitee('marsaoui', villes)).toBeNull();
    expect(villeCitee('un plombier', villes)).toBeNull();
  });
});
