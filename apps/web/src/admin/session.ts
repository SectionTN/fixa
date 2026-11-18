import { fr, messageAuth, roleDe } from '@fixa/core';
import { AppwriteException } from 'appwrite';
import { useCallback, useEffect, useState } from 'react';
import { compte } from '../appwrite';

export type EtatAdmin =
  | { statut: 'chargement' }
  | { statut: 'deconnecte'; message?: string }
  | { statut: 'admin'; nom: string };

// Any account without the admin label is signed out again, so the back office never holds a client session.
export function useAdmin() {
  const [etat, setEtat] = useState<EtatAdmin>({ statut: 'chargement' });

  const verifier = useCallback(async () => {
    try {
      const u = await compte.get();
      if (roleDe(u.labels) === 'admin') {
        setEtat({ statut: 'admin', nom: u.name });
        return;
      }
      await compte.deleteSession({ sessionId: 'current' }).catch(() => undefined);
      setEtat({ statut: 'deconnecte', message: fr.auth.admin.refuse });
    } catch {
      setEtat({ statut: 'deconnecte' });
    }
  }, []);

  useEffect(() => {
    verifier();
  }, [verifier]);

  const connexion = useCallback(
    async (email: string, motDePasse: string) => {
      try {
        await compte.createEmailPasswordSession({ email: email.trim(), password: motDePasse });
      } catch (e) {
        setEtat({
          statut: 'deconnecte',
          message: messageAuth(e instanceof AppwriteException ? e.type : undefined),
        });
        return;
      }
      await verifier();
    },
    [verifier],
  );

  const deconnexion = useCallback(async () => {
    await compte.deleteSession({ sessionId: 'current' }).catch(() => undefined);
    setEtat({ statut: 'deconnecte' });
  }, []);

  return { etat, connexion, deconnexion };
}
