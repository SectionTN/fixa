import { useCallback, useEffect, useState } from 'react';

// The admin has three pages, so the address bar is read directly instead of through a router.
export function useChemin(): {
  chemin: string;
  aller: (chemin: string) => void;
  remplacer: (chemin: string) => void;
} {
  const [chemin, setChemin] = useState(window.location.pathname);
  useEffect(() => {
    const suivre = () => setChemin(window.location.pathname);
    window.addEventListener('popstate', suivre);
    return () => window.removeEventListener('popstate', suivre);
  }, []);
  const aller = useCallback((suivant: string) => {
    window.history.pushState(null, '', suivant);
    setChemin(suivant);
  }, []);
  const remplacer = useCallback((suivant: string) => {
    window.history.replaceState(null, '', suivant);
    setChemin(suivant);
  }, []);
  return { chemin, aller, remplacer };
}

export const CHEMINS = {
  connexion: '/admin/connexion',
  accueil: '/admin',
  validation: '/admin/validation',
} as const;
