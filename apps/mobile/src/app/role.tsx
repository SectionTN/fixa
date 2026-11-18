import { useState } from 'react';
import { ChoixRole } from '../composants/ChoixRole';
import { useSession } from '../lib/session';

// The role choice for a signed-in account without a role, after a role call that failed or a first Google login.
export default function RoleManquant() {
  const { choisirRole } = useSession();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  return (
    <ChoixRole
      enCours={enCours}
      erreur={erreur}
      onContinuer={async (type) => {
        setEnCours(true);
        setErreur(null);
        const r = await choisirRole(type);
        if (!r.ok) setErreur(r.message);
        setEnCours(false);
      }}
    />
  );
}
