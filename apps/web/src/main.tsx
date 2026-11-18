import {
  ancienneteAValider,
  type TableauDeBord as Comptes,
  compterTableauDeBord,
} from '@fixa/core';
import { FixaProvider } from '@fixa/ui';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Connexion } from './admin/Connexion';
import { Coque } from './admin/Coque';
import { useAdmin } from './admin/session';
import { TableauDeBord } from './admin/TableauDeBord';
import { Query, tables } from './appwrite';
import { useChemin } from './chemin';

const CONNEXION = '/admin/connexion';
const ACCUEIL = '/admin';

function EspaceAdmin({ nom, onDeconnexion }: { nom: string; onDeconnexion: () => void }) {
  const [comptes, setComptes] = useState<Comptes | null>(null);
  const [anciennete, setAnciennete] = useState<number | null>(null);
  const [erreur, setErreur] = useState(false);
  const [misAJour, setMisAJour] = useState(() => new Date().toISOString());

  useEffect(() => {
    let actif = true;
    const maintenant = new Date(misAJour);
    setErreur(false);
    compterTableauDeBord(tables, Query, maintenant).then(
      (c) => actif && setComptes(c),
      () => actif && setErreur(true),
    );
    ancienneteAValider(tables, Query, maintenant).then(
      (a) => actif && setAnciennete(a),
      () => actif && setAnciennete(null),
    );
    return () => {
      actif = false;
    };
  }, [misAJour]);

  return (
    <Coque nom={nom} aValider={comptes?.aValider ?? null} onDeconnexion={onDeconnexion}>
      <TableauDeBord
        comptes={comptes}
        anciennete={anciennete}
        misAJour={misAJour}
        erreur={erreur}
        onReessayer={() => setMisAJour(new Date().toISOString())}
      />
    </Coque>
  );
}

function App() {
  const { etat, connexion, deconnexion } = useAdmin();
  const [chemin, remplacer] = useChemin();
  const cible = etat.statut === 'admin' ? ACCUEIL : CONNEXION;

  useEffect(() => {
    if (etat.statut !== 'chargement' && chemin !== cible) remplacer(cible);
  }, [etat.statut, chemin, cible, remplacer]);

  if (etat.statut === 'chargement') return null;
  if (etat.statut === 'admin') return <EspaceAdmin nom={etat.nom} onDeconnexion={deconnexion} />;
  return <Connexion message={etat.message} onConnexion={connexion} />;
}

const racine = document.getElementById('root');
if (!racine) throw new Error('#root is missing in index.html');

createRoot(racine).render(
  <StrictMode>
    <FixaProvider>
      <App />
    </FixaProvider>
  </StrictMode>,
);
