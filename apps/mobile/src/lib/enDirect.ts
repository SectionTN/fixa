import { abonnerRendezVous, BASE, type RendezVous, TABLES } from '@fixa/core';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Channel } from 'react-native-appwrite';
import { client } from './appwrite';
import { signalerChangement } from './demandes';

const CANAL = Channel.tablesdb(BASE).table(TABLES.rendezVous).row().toString();

let arretEnCours: (() => void) | null = null;
const ecouteurs = new Set<(rdv: RendezVous) => void>();

// Sign-out calls this before deleting the session, else the server drops the socket and the SDK logs a lost connection.
export function arreterEnDirect() {
  arretEnCours?.();
}

// Each booking row the realtime channel delivers, for screens that react to one change in particular.
export function ecouterRendezVous(ecouteur: (rdv: RendezVous) => void): () => void {
  ecouteurs.add(ecouteur);
  return () => {
    ecouteurs.delete(ecouteur);
  };
}

// Any change to one of the user's bookings makes every booking screen read again.
export function useRendezVousEnDirect(userId: string | null) {
  useEffect(() => {
    if (!userId) return;
    const desabonner = abonnerRendezVous(client, CANAL, userId, (rdv) => {
      signalerChangement();
      for (const ecouteur of ecouteurs) ecouteur(rdv);
    });
    const arreter = () => {
      if (arretEnCours === arreter) arretEnCours = null;
      desabonner();
    };
    arretEnCours = arreter;
    // Realtime does not replay what happened while the app was in the background.
    const etat = AppState.addEventListener('change', (e) => {
      if (e === 'active') signalerChangement();
    });
    return () => {
      if (arretEnCours === arreter) arreter();
      etat.remove();
    };
  }, [userId]);
}
