import { nbARepondre, textes } from '@fixa/core';
import { TabList, TabSlot, Tabs, TabTrigger } from 'expo-router/ui';
import { useState } from 'react';
import { BarreOnglets } from '../../composants/BarreOnglets';
import { HauteurOngletsContexte, Onglet } from '../../composants/Onglet';
import { DemandesContexte, useLireDemandes } from '../../lib/demandes';
import { useSession } from '../../lib/session';

const t = textes.onglets;

// The provider tab bar on Android. Agenda and Services wait for their screens.
export default function FournisseurLayout() {
  const [hauteur, setHauteur] = useState(0);
  const { utilisateur } = useSession();
  const demandes = useLireDemandes(utilisateur?.id ?? null);
  const d = demandes.donnees;
  const aRepondre = d ? nbARepondre(d.liste, d.maintenant) : 0;
  return (
    <DemandesContexte.Provider value={demandes}>
      <HauteurOngletsContexte.Provider value={hauteur}>
        <Tabs>
          <TabSlot />
          <TabList asChild>
            <BarreOnglets onHauteur={setHauteur}>
              <TabTrigger name="accueil" href="/accueil" asChild>
                <Onglet
                  icone="space_dashboard"
                  iconeActive="space_dashboard_fill"
                  libelle={t.accueil}
                />
              </TabTrigger>
              <TabTrigger name="demandes" href="/demandes" asChild>
                <Onglet
                  icone="inbox"
                  iconeActive="inbox"
                  libelle={t.demandes}
                  pastille={aRepondre}
                />
              </TabTrigger>
              <TabTrigger name="compte" href="/compte" asChild>
                <Onglet icone="person" iconeActive="person_fill" libelle={t.compte} />
              </TabTrigger>
            </BarreOnglets>
          </TabList>
        </Tabs>
      </HauteurOngletsContexte.Provider>
    </DemandesContexte.Provider>
  );
}
