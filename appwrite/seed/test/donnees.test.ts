import { cellules, distanceKm, type Fournisseur, type RendezVous, TABLES } from '@fixa/core';
import { describe, expect, it } from 'vitest';
import { donnees } from '../donnees';

// Sunday 10:10 in Tunis.
const maintenant = new Date('2026-10-25T09:10:00Z');
const d = donnees(maintenant);
const lignes = <K extends keyof typeof d.tables>(table: K) => d.tables[table].map((l) => l.ligne);
const rdvs = lignes('rendez_vous');
const fournisseur = (id: string) => lignes('fournisseurs').find((f) => f.$id === id) as Fournisseur;

describe('donnees du seed', () => {
  it('place les plombiers aux distances du design depuis chez Yasmine', () => {
    const yasmine = lignes('profils').find((p) => p.$id === 'u-yasmine');
    const chez = { lat: yasmine?.latitude ?? 0, lng: yasmine?.longitude ?? 0 };
    const km = (id: string) =>
      distanceKm(chez, { lat: fournisseur(id).latitude, lng: fournisseur(id).longitude });
    expect(km('u-karim')).toBeCloseTo(1.2, 1);
    expect(km('u-sami')).toBeCloseTo(2.8, 1);
    expect(km('u-hedi')).toBeCloseTo(3.1, 1);
    expect(km('u-ennour')).toBeCloseTo(4.0, 1);
  });

  it('prixMin vaut le plus petit prix des services visibles', () => {
    for (const f of lignes('fournisseurs')) {
      const prix = lignes('services')
        .filter((s) => s.fournisseurId === f.$id && s.estVisible && s.prix !== null)
        .map((s) => s.prix as number);
      expect([f.$id, f.prixMin]).toEqual([f.$id, Math.min(...prix)]);
    }
  });

  it('envoie les artisans chez le client, et le client au cabinet, au salon ou au garage', () => {
    const chez = (id: string) => lignes('services').find((s) => s.$id === id)?.aDomicile;
    expect(chez('s-karim-fuite')).toBe(true);
    expect(chez('s-nadia-complet')).toBe(true);
    expect(chez('s-walid-depannage')).toBe(true);
    expect(chez('s-amira-consultation')).toBe(false);
    expect(chez('s-leila-brushing')).toBe(false);
    expect(chez('s-mansour-vidange')).toBe(false);
    for (const r of rdvs) {
      expect([r.$id, r.adresse !== '']).toEqual([r.$id, chez(r.serviceId)]);
    }
  });

  it('donne a Yasmine le menage du jour et une visite notee, rien de plus', () => {
    const siens = rdvs.filter((r) => r.clientId === 'u-yasmine');
    expect(siens.map((r) => [r.statut, r.fournisseurId])).toEqual([
      ['CONFIRME', 'u-nadia'],
      ['TERMINE', 'u-nadia'],
    ]);
    const enCours = siens.find((r) => r.statut === 'CONFIRME' && r.fournisseurId === 'u-nadia');
    expect(enCours?.debut).toBe('2026-10-25T08:00:00.000Z');
  });

  it('occupe exactement les cellules des rendez-vous qui tiennent un creneau', () => {
    const tenus = rdvs.filter((r) => r.statut === 'EN_ATTENTE' || r.statut === 'CONFIRME');
    const attendues = tenus.flatMap((r: RendezVous) =>
      cellules(r.debut, r.duree).map((cellule) => `${r.fournisseurId} ${cellule} ${r.$id}`),
    );
    const semees = lignes('creneaux_occupes').map(
      (c) => `${c.fournisseurId} ${c.cellule} ${c.rendezVousId}`,
    );
    expect(semees.sort()).toEqual(attendues.sort());
    const paires = lignes('creneaux_occupes').map((c) => `${c.fournisseurId} ${c.cellule}`);
    expect(new Set(paires).size).toBe(paires.length);
  });

  it('relie chaque avis a un rendez-vous termine du meme client', () => {
    const avis = lignes('avis');
    for (const a of avis) {
      const r = rdvs.find((x) => x.$id === a.rendezVousId);
      expect(r).toMatchObject({
        statut: 'TERMINE',
        aAvis: true,
        fournisseurId: a.fournisseurId,
        clientId: a.clientId,
        clientNom: a.clientNom,
        serviceTitre: a.serviceTitre,
      });
    }
    expect(rdvs.filter((r) => r.aAvis).length).toBe(avis.length);
    expect(avis.filter((a) => a.fournisseurId === 'u-karim')).toHaveLength(2);
  });

  it('reste identique dans la meme demi-heure et cale les dates sur la grille', () => {
    expect(donnees(new Date('2026-10-25T09:25:00Z'))).toEqual(d);
    for (const r of rdvs) expect(Date.parse(r.debut) % (30 * 60_000)).toBe(0);
  });

  it('verrouille chaque statut quitte, jamais le statut actuel', () => {
    for (const r of rdvs) {
      const chemin = lignes('transitions').filter((t) => t.rendezVousId === r.$id);
      expect(chemin.some((t) => t.de === r.statut)).toBe(false);
      if (r.statut === 'EN_ATTENTE') {
        expect(chemin).toEqual([]);
        continue;
      }
      expect(chemin[0]?.de).toBe('EN_ATTENTE');
      expect(chemin.at(-1)?.vers).toBe(r.statut);
      chemin.forEach((t, i) => {
        expect(t.$id).toBe(`${r.$id}.${t.de}`);
        if (i > 0) expect(t.de).toBe(chemin[i - 1]?.vers);
      });
    }
  });

  it('n ecrit ni apostrophe courbe, ni guillemet courbe, ni tiret long', () => {
    expect(JSON.stringify(d).match(/[‘’“”–—]/g)).toBeNull();
  });

  it('utilise des ids Appwrite valides et uniques par table', () => {
    for (const table of Object.values(TABLES)) {
      const ids = d.tables[table].map((l) => l.ligne.$id);
      for (const id of ids) expect(id).toMatch(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('donne un profil a chaque compte et les bons roles', () => {
    expect(d.comptes.map((c) => c.$id).sort()).toEqual(
      lignes('profils')
        .map((p) => p.$id)
        .sort(),
    );
    const role = (id: string) => d.comptes.find((c) => c.$id === id)?.labels;
    expect(role('u-salma')).toEqual(['admin']);
    expect(role('u-yasmine')).toEqual(['client']);
    for (const f of lignes('fournisseurs')) expect(role(f.$id)).toEqual(['fournisseur']);
    expect(fournisseur('u-walid')).toMatchObject({
      statutVerification: 'EN_ATTENTE',
      visible: false,
    });
  });

  it('donne a Walid, en attente de validation, un telephone que l admin peut appeler', () => {
    const walid = lignes('profils').find((p) => p.$id === 'u-walid');
    expect(walid?.telephone).toBe('+216 52 418 903');
  });

  it('pose les permissions de ligne que l api poserait', () => {
    for (const { ligne, permissions } of d.tables.rendez_vous) {
      expect(permissions.sort()).toEqual(
        [`read("user:${ligne.clientId}")`, `read("user:${ligne.fournisseurId}")`].sort(),
      );
    }
    const fournisseurs = new Set(lignes('fournisseurs').map((f) => f.$id));
    for (const { ligne, permissions } of d.tables.profils) {
      const attendues = [`read("user:${ligne.$id}")`, `update("user:${ligne.$id}")`];
      if (fournisseurs.has(ligne.$id)) attendues.push('read("any")');
      expect(permissions).toEqual(attendues);
    }
  });
});
