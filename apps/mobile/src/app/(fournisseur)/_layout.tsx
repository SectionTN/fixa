import { fr, nbARepondre } from '@fixa/core';
import { NativeTabs } from 'expo-router/native-tabs';
import { HauteurOngletsContexte, useCouleur } from '../../composants/Onglet';
import { DemandesContexte, useLireDemandes } from '../../lib/demandes';
import { useSession } from '../../lib/session';

const t = fr.onglets;

// The provider tab bar as the system draws it. Android has its own file. Agenda and Services wait for their screens.
export default function FournisseurLayout() {
  const primaire = useCouleur('primary');
  const { utilisateur } = useSession();
  const demandes = useLireDemandes(utilisateur?.id ?? null);
  const d = demandes.donnees;
  const aRepondre = d ? nbARepondre(d.liste, d.maintenant) : 0;
  return (
    <DemandesContexte.Provider value={demandes}>
      <HauteurOngletsContexte.Provider value="systeme">
        <NativeTabs tintColor={primaire}>
          <NativeTabs.Trigger name="accueil">
            <NativeTabs.Trigger.Icon
              sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }}
            />
            <NativeTabs.Trigger.Label>{t.accueil}</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="demandes">
            <NativeTabs.Trigger.Icon sf={{ default: 'tray', selected: 'tray.fill' }} />
            <NativeTabs.Trigger.Label>{t.demandes}</NativeTabs.Trigger.Label>
            {/* A Badge with text always shows, hidden only applies to an empty one, so 0 renders none. */}
            {aRepondre > 0 ? (
              <NativeTabs.Trigger.Badge>{String(aRepondre)}</NativeTabs.Trigger.Badge>
            ) : null}
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="compte">
            <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} />
            <NativeTabs.Trigger.Label>{t.compte}</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      </HauteurOngletsContexte.Provider>
    </DemandesContexte.Provider>
  );
}
