import { fr } from '@fixa/core';
import { TabList, TabSlot, Tabs, TabTrigger } from 'expo-router/ui';
import { Onglet, useStyleBarre } from '../../composants/Onglet';

const t = fr.onglets;

// The client tab bar: Favoris waits until favourites exist.
export default function ClientLayout() {
  const style = useStyleBarre();
  return (
    <Tabs>
      <TabSlot />
      {/* Tabs and TabList read their direct children to find the routes, so the bar is styled in place. */}
      <TabList style={style}>
        <TabTrigger name="index" href="/" asChild>
          <Onglet icone="home" iconeActive="home_fill" libelle={t.accueil} />
        </TabTrigger>
        <TabTrigger name="rendez-vous" href="/rendez-vous" asChild>
          <Onglet icone="calendar_month" iconeActive="calendar_month_fill" libelle={t.mesRdv} />
        </TabTrigger>
        <TabTrigger name="profil" href="/profil" asChild>
          <Onglet icone="person" iconeActive="person_fill" libelle={t.profil} />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}
