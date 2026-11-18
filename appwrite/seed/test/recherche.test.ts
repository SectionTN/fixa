import {
  FILTRES_VIDES,
  filtrerFournisseurs,
  mieuxNotes,
  preparerFournisseurs,
  trierFournisseurs,
} from '@fixa/core';
import { describe, expect, it } from 'vitest';
import { donnees } from '../donnees';

// The demo story on the seeded rows: seed and search both on Wednesday 18 November, 10:00 in Tunis.
const maintenant = new Date('2026-11-18T09:00:00Z');
const d = donnees(maintenant);
const lignes = <K extends keyof typeof d.tables>(table: K) => d.tables[table].map((l) => l.ligne);
const yasmine = lignes('profils').find((p) => p.$id === 'u-yasmine');
const chez = { lat: yasmine?.latitude ?? 0, lng: yasmine?.longitude ?? 0 };

function preparer(categorieId: string | null) {
  const fournisseurs = lignes('fournisseurs').filter(
    (f) => f.visible && (categorieId === null || f.categorieId === categorieId),
  );
  const ids = new Set(fournisseurs.map((f) => f.$id));
  const creneaux = Object.fromEntries(
    [...ids].map((id) => [
      id,
      {
        disponibilites: lignes('disponibilites').filter((x) => x.fournisseurId === id),
        conges: lignes('conges').filter((x) => x.fournisseurId === id),
        occupees: lignes('creneaux_occupes')
          .filter((x) => x.fournisseurId === id)
          .map((x) => x.cellule),
      },
    ]),
  );
  return preparerFournisseurs({
    fournisseurs,
    services: lignes('services').filter((s) => ids.has(s.fournisseurId)),
    creneaux,
    specialites: {},
    position: chez,
    maintenant,
  });
}

describe('recherche sur les donnees du seed', () => {
  it('met Karim en tete de Plomberie sous Recommandes', () => {
    const noms = trierFournisseurs(preparer('plomberie')).map((f) => f.nom);
    expect(noms).toHaveLength(4);
    expect(noms[0]).toBe('Karim Ben Salah');
  });

  it('garde Karim et Sami avec 4,8 et plus', () => {
    const f = { ...FILTRES_VIDES, noteMin: 4.8 };
    const noms = filtrerFournisseurs(preparer('plomberie'), f, maintenant).map((x) => x.nom);
    expect(noms.sort()).toEqual(['Karim Ben Salah', 'Sami Trabelsi']);
  });

  it('donne a Karim quatre services et un prix de depart', () => {
    const karim = preparer('plomberie').find((f) => f.$id === 'u-karim');
    expect(lignes('services').filter((s) => s.fournisseurId === 'u-karim')).toHaveLength(4);
    expect(karim?.prixDepart).toBe('dès 45 DT');
    expect(karim?.prochainCreneau).not.toBeNull();
  });

  it('ouvre les mieux notes par Nadia, puis Karim avant Amira', () => {
    expect(mieuxNotes(preparer(null), 5).map((f) => f.$id)).toEqual([
      'u-nadia',
      'u-karim',
      'u-amira',
      'u-sami',
      'u-leila',
    ]);
  });
});
