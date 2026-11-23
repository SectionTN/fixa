import { textes } from '@fixa/core';
import { NativeTabs } from 'expo-router/native-tabs';
import { HauteurOngletsContexte, useCouleur } from '../../composants/Onglet';

const t = textes.onglets;

// The client tab bar as the system draws it, Liquid Glass and the iPhone Duo side bar included. Android has its own file.
export default function ClientLayout() {
  const primaire = useCouleur('primary');
  return (
    <HauteurOngletsContexte.Provider value="systeme">
      <NativeTabs tintColor={primaire}>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
          <NativeTabs.Trigger.Label>{t.accueil}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="rendez-vous">
          <NativeTabs.Trigger.Icon sf="calendar" />
          <NativeTabs.Trigger.Label>{t.mesRdv}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="favoris">
          <NativeTabs.Trigger.Icon sf={{ default: 'heart', selected: 'heart.fill' }} />
          <NativeTabs.Trigger.Label>{t.favoris}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profil">
          <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} />
          <NativeTabs.Trigger.Label>{t.profil}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </HauteurOngletsContexte.Provider>
  );
}
