import { File, Paths } from 'expo-file-system';
import { createContext, type ReactNode, useContext, useState } from 'react';
import { Appearance } from 'react-native';

export type Theme = 'light' | 'dark';

const fichier = () => new File(Paths.document, 'theme.txt');

// Read before the first render, so the app never flashes light before a saved dark choice.
function themeSauvegarde(): Theme {
  try {
    const f = fichier();
    return f.exists && f.textSync().trim() === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

// Native parts (tab bar, keyboard, sheets) follow this, while Tamagui follows the provider.
function appliquer(theme: Theme) {
  Appearance.setColorScheme(theme);
}

type Valeur = { theme: Theme; changer: (t: Theme) => void };
const Contexte = createContext<Valeur>({ theme: 'light', changer: () => {} });

export function ThemeProvider({ children }: { children: (theme: Theme) => ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const t = themeSauvegarde();
    appliquer(t);
    return t;
  });
  const changer = (t: Theme) => {
    if (t === theme) return;
    appliquer(t);
    setTheme(t);
    fichier()
      .write(t)
      .catch(() => {});
  };
  return <Contexte.Provider value={{ theme, changer }}>{children(theme)}</Contexte.Provider>;
}

export const useApparence = () => useContext(Contexte);
