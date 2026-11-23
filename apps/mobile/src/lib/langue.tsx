import { choisirLangue, type Langue, langueCourante, textes } from '@fixa/core';
import { File, Paths } from 'expo-file-system';
import { createContext, type ReactNode, useContext, useState } from 'react';
import { Alert, DevSettings, I18nManager } from 'react-native';

const fichier = () => new File(Paths.document, 'langue.txt');

// Read before the first render, so the first screen is already in the saved language.
export function chargerLangue(): void {
  try {
    const f = fichier();
    const l = f.exists ? f.textSync().trim() : '';
    if (l === 'fr' || l === 'en' || l === 'ar') choisirLangue(l);
  } catch {
    // No saved choice yet, French stays.
  }
  const rtl = langueCourante() === 'ar';
  if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
  }
}

type Valeur = { langue: Langue; changer: (l: Langue) => void };
const Contexte = createContext<Valeur>({ langue: 'fr', changer: () => {} });

export function LangueProvider({ children }: { children: ReactNode }) {
  const [langue, setLangue] = useState<Langue>(langueCourante());
  const changer = (l: Langue) => {
    if (l === langue) return;
    choisirLangue(l);
    setLangue(l);
    fichier()
      .write(l)
      .catch(() => {});
    const rtl = l === 'ar';
    if (I18nManager.isRTL === rtl) return;
    // The layout direction is fixed when the app starts, so Arabic needs a restart.
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
    if (__DEV__) {
      DevSettings.reload();
      return;
    }
    Alert.alert(textes.auth.profil.redemarrerTitre, textes.auth.profil.redemarrer);
  };
  return <Contexte.Provider value={{ langue, changer }}>{children}</Contexte.Provider>;
}

export const useLangue = () => useContext(Contexte);
