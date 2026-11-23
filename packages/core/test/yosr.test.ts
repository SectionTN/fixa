import { describe, expect, it } from 'vitest';
import { analyserMessage, normaliserMessage } from '../src/yosr';

describe('analyserMessage', () => {
  it('reconnait une fuite en francais', () => {
    expect(analyserMessage("ma douche fuit, il me faut quelqu'un demain matin")).toEqual({
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
    expect(analyserMessage("Urgent, ça coule fort sous l'évier")).toEqual({
      categorieId: 'plomberie',
      urgence: true,
    });
  });

  it('ne devine rien sans mot connu', () => {
    expect(analyserMessage('bonjour')).toEqual({ categorieId: null, urgence: false });
    expect(analyserMessage('beaucoup de travail au bureau').categorieId).toBeNull();
  });
});

describe('normaliserMessage', () => {
  it('retire accents, ponctuation et variantes arabes', () => {
    expect(normaliserMessage('Électricité !')).toBe('electricite');
    expect(normaliserMessage('أإآ ة')).toBe('ااا ه');
  });
});
