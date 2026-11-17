import { LONGUEUR_MAX, TABLES } from '@fixa/core';
import { describe, expect, it } from 'vitest';
import config from '../../appwrite.config.json';
import { donnees, type NomTable } from '../donnees';

type Colonne = {
  key: string;
  type: string;
  required: boolean;
  array?: boolean;
  size?: number;
  min?: number;
  max?: number;
  format?: string;
  elements?: string[];
};
type Table = { $id: string; columns: Colonne[]; indexes: { key: string; columns: string[] }[] };

const tables = config.tables as Table[];
const semees = donnees(new Date('2026-10-25T09:10:00Z')).tables;

function erreurValeur(c: Colonne, v: unknown): string | null {
  if (v === null || v === undefined) return c.required ? 'vide sur une colonne requise' : null;
  if (c.array) {
    if (!Array.isArray(v)) return 'tableau attendu';
    const erreurs = v.map((e) => erreurValeur({ ...c, array: false, required: true }, e));
    return erreurs.find((e) => e !== null) ?? null;
  }
  switch (c.type) {
    case 'varchar':
      return typeof v === 'string' && v.length <= (c.size ?? 0) ? null : `texte de ${c.size} max`;
    case 'text':
      return typeof v === 'string' ? null : 'texte attendu';
    case 'string':
      return c.format === 'enum' && typeof v === 'string' && c.elements?.includes(v)
        ? null
        : `hors enum ${c.elements?.join('|')}`;
    case 'integer':
      return Number.isInteger(v) &&
        (c.min === undefined || (v as number) >= c.min) &&
        (c.max === undefined || (v as number) <= c.max)
        ? null
        : 'entier hors bornes';
    case 'double':
      return typeof v === 'number' && Number.isFinite(v) ? null : 'nombre attendu';
    case 'boolean':
      return typeof v === 'boolean' ? null : 'booleen attendu';
    case 'datetime':
      return typeof v === 'string' && new Date(v).toISOString() === v ? null : 'date ISO attendue';
    default:
      return `type ${c.type} inconnu`;
  }
}

describe('appwrite.config.json', () => {
  it('declare exactement les tables du code', () => {
    expect(tables.map((t) => t.$id).sort()).toEqual(Object.values(TABLES).sort());
  });

  it('fait tenir chaque longueur maximale des formulaires dans ses colonnes', () => {
    const taille = (table: string, cle: string) =>
      tables.find((t) => t.$id === table)?.columns.find((c) => c.key === cle)?.size ?? 0;
    const L = LONGUEUR_MAX;
    const nomComplet = L.prenom + 1 + L.nom;
    expect(L.prenom).toBeLessThanOrEqual(taille('profils', 'prenom'));
    expect(L.nom).toBeLessThanOrEqual(taille('profils', 'nom'));
    expect(nomComplet).toBeLessThanOrEqual(taille('fournisseurs', 'nom'));
    expect(nomComplet).toBeLessThanOrEqual(taille('rendez_vous', 'clientNom'));
    expect(nomComplet).toBeLessThanOrEqual(taille('avis', 'clientNom'));
    expect(L.telephone).toBeLessThanOrEqual(taille('profils', 'telephone'));
    expect(L.telephone).toBeLessThanOrEqual(taille('rendez_vous', 'clientTelephone'));
    expect(L.ville).toBeLessThanOrEqual(taille('profils', 'ville'));
    expect(L.ville).toBeLessThanOrEqual(taille('fournisseurs', 'ville'));
    expect(L.adresse).toBeLessThanOrEqual(taille('rendez_vous', 'adresse'));
    expect(L.motif).toBeLessThanOrEqual(taille('rendez_vous', 'motif'));
    expect(L.motif).toBeLessThanOrEqual(taille('fournisseurs', 'motifRefus'));
  });

  describe.each(tables)('$id', (table) => {
    const lignes = semees[table.$id as NomTable].map(
      (l) => l.ligne as unknown as Record<string, unknown>,
    );
    const cles = table.columns.map((c) => c.key);

    it('a au moins une ligne semee', () => {
      expect(lignes.length).toBeGreaterThan(0);
    });

    it('chaque ligne semee tient dans les colonnes declarees', () => {
      const erreurs: string[] = [];
      for (const ligne of lignes) {
        for (const champ of Object.keys(ligne)) {
          if (champ !== '$id' && !cles.includes(champ))
            erreurs.push(`${ligne.$id}.${champ}: colonne absente`);
        }
        for (const c of table.columns) {
          const erreur = erreurValeur(c, ligne[c.key]);
          if (erreur) erreurs.push(`${ligne.$id}.${c.key}: ${erreur}`);
        }
      }
      expect(erreurs).toEqual([]);
    });

    it('chaque colonne est remplie par au moins une ligne', () => {
      const vides = cles.filter((cle) => lignes.every((l) => l[cle] === undefined));
      expect(vides).toEqual([]);
    });

    it('les index portent sur des colonnes declarees', () => {
      const inconnues = table.indexes.flatMap((i) => i.columns.filter((c) => !cles.includes(c)));
      expect(inconnues).toEqual([]);
    });
  });
});
