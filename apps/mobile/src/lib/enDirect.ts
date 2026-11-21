import { abonnerRendezVous, BASE, TABLES } from '@fixa/core';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Channel } from 'react-native-appwrite';
import { client } from './appwrite';
import { signalerChangement } from './demandes';

const CANAL = Channel.tablesdb(BASE).table(TABLES.rendezVous).row().toString();

let arretEnCours: (() => void) | null = null;

// Sign-out calls this before deleting the session, else the server drops the socket and the SDK logs a lost connection.
export function arreterEnDirect() {
  arretEnCours?.();
}

// Any change to one of the user's bookings makes every booking screen read again.
export function useRendezVousEnDirect(userId: string | null) {
  useEffect(() => {
    if (!userId) return;
    const desabonner = abonnerRendezVous(client, CANAL, userId, () => signalerChangement());
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
