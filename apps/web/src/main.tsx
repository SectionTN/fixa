import {
  ancienneteAValider,
  type TableauDeBord as Comptes,
  compterTableauDeBord,
} from '@fixa/core';
import { FixaProvider } from '@fixa/ui';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Connexion } from './admin/Connexion';
import { Coque, type PageAdmin } from './admin/Coque';
import { useAdmin } from './admin/session';
import { TableauDeBord } from './admin/TableauDeBord';
import { Validation } from './admin/Validation';
import { Query, tables } from './appwrite';
import { CHEMINS, useChemin } from './chemin';

function EspaceAdmin({
  nom,
  page,
  aller,
  onDeconnexion,
}: {
  nom: string;
  page: PageAdmin;
  aller: (chemin: string) => void;
  onDeconnexion: () => void;
}) {
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

  const relire = () => setMisAJour(new Date().toISOString());
  // Each page change reads the counts again, so the dashboard and the sidebar count are current.
  const changerDePage = (chemin: string) => {
    aller(chemin);
    relire();
  };

  return (
    <Coque
      nom={nom}
      page={page}
      aValider={comptes?.aValider ?? null}
      aller={changerDePage}
      onDeconnexion={onDeconnexion}
    >
      {page === 'validation' ? (
        <Validation onDecision={relire} onSessionExpiree={onDeconnexion} />
      ) : (
        <TableauDeBord
          comptes={comptes}
          anciennete={anciennete}
          misAJour={misAJour}
          erreur={erreur}
          onReessayer={relire}
          aller={changerDePage}
        />
      )}
    </Coque>
  );
}

function App() {
  const { etat, connexion, deconnexion } = useAdmin();
  const { chemin, aller, remplacer } = useChemin();
  const page: PageAdmin = chemin === CHEMINS.validation ? 'validation' : 'accueil';
  const cible =
    etat.statut !== 'admin'
      ? CHEMINS.connexion
      : page === 'validation'
        ? CHEMINS.validation
        : CHEMINS.accueil;

  useEffect(() => {
    if (etat.statut !== 'chargement' && chemin !== cible) remplacer(cible);
  }, [etat.statut, chemin, cible, remplacer]);

  if (etat.statut === 'chargement') return null;
  if (etat.statut === 'admin') {
    return <EspaceAdmin nom={etat.nom} page={page} aller={aller} onDeconnexion={deconnexion} />;
  }
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
