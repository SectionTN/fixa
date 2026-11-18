import { useCallback, useEffect, useState } from 'react';

// The admin has two pages, so the address bar is read directly instead of through a router.
export function useChemin(): [string, (chemin: string) => void] {
  const [chemin, setChemin] = useState(window.location.pathname);
  useEffect(() => {
    const suivre = () => setChemin(window.location.pathname);
    window.addEventListener('popstate', suivre);
    return () => window.removeEventListener('popstate', suivre);
  }, []);
  const remplacer = useCallback((suivant: string) => {
    window.history.replaceState(null, '', suivant);
    setChemin(suivant);
  }, []);
  return [chemin, remplacer];
}
