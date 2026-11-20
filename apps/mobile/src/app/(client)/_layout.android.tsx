import { fr } from '@fixa/core';
import { TabList, TabSlot, Tabs, TabTrigger } from 'expo-router/ui';
import { useState } from 'react';
import { BarreOnglets } from '../../composants/BarreOnglets';
import { HauteurOngletsContexte, Onglet } from '../../composants/Onglet';

const t = fr.onglets;

// The client tab bar on Android: Favoris waits until favourites exist.
export default function ClientLayout() {
  const [hauteur, setHauteur] = useState(0);
  return (
    <HauteurOngletsContexte.Provider value={hauteur}>
      <Tabs>
        <TabSlot />
        {/* Tabs and TabList read the triggers from the bar's children, so they stay its direct children. */}
        <TabList asChild>
          <BarreOnglets onHauteur={setHauteur}>
            <TabTrigger name="index" href="/" asChild>
              <Onglet icone="home" iconeActive="home_fill" libelle={t.accueil} />
            </TabTrigger>
            <TabTrigger name="rendez-vous" href="/rendez-vous" asChild>
              <Onglet icone="calendar_month" iconeActive="calendar_month_fill" libelle={t.mesRdv} />
            </TabTrigger>
            <TabTrigger name="profil" href="/profil" asChild>
              <Onglet icone="person" iconeActive="person_fill" libelle={t.profil} />
            </TabTrigger>
          </BarreOnglets>
        </TabList>
      </Tabs>
    </HauteurOngletsContexte.Provider>
  );
}
