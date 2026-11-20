import { fr, nbARepondre } from '@fixa/core';
import { TabList, TabSlot, Tabs, TabTrigger } from 'expo-router/ui';
import { Onglet, useStyleBarre } from '../../composants/Onglet';
import { DemandesContexte, useLireDemandes } from '../../lib/demandes';
import { useSession } from '../../lib/session';

const t = fr.onglets;

// The provider tab bar. Agenda and Services wait for their screens.
export default function FournisseurLayout() {
  const style = useStyleBarre();
  const { utilisateur } = useSession();
  const demandes = useLireDemandes(utilisateur?.id ?? null);
  const d = demandes.donnees;
  const aRepondre = d ? nbARepondre(d.liste, d.maintenant) : 0;
  return (
    <DemandesContexte.Provider value={demandes}>
      <Tabs>
        <TabSlot />
        <TabList style={style}>
          <TabTrigger name="accueil" href="/accueil" asChild>
            <Onglet
              icone="space_dashboard"
              iconeActive="space_dashboard_fill"
              libelle={t.accueil}
            />
          </TabTrigger>
          <TabTrigger name="demandes" href="/demandes" asChild>
            <Onglet icone="inbox" iconeActive="inbox" libelle={t.demandes} pastille={aRepondre} />
          </TabTrigger>
          <TabTrigger name="compte" href="/compte" asChild>
            <Onglet icone="person" iconeActive="person_fill" libelle={t.compte} />
          </TabTrigger>
        </TabList>
      </Tabs>
    </DemandesContexte.Provider>
  );
}
