import { fr, messageAuth, nonceDuJeton, type Role, roleDe, separerNom } from '@fixa/core';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppwriteException, ID, IdTokenProvider } from 'react-native-appwrite';
import { api, quandSessionExpire } from './api';
import { compte } from './appwrite';
import { jetonGoogle, oublierGoogle } from './google';

export type Utilisateur = { id: string; email: string; nom: string };
export type TypeCompte = 'client' | 'fournisseur';
export type Resultat = { ok: true } | { ok: false; message: string };
export type Inscription = {
  email: string;
  motDePasse: string;
  nomComplet: string;
  telephone: string;
  type: TypeCompte;
};

type Etat = { utilisateur: Utilisateur | null; role: Role | null; chargement: boolean };

type Session = Etat & {
  connexion(email: string, motDePasse: string): Promise<Resultat>;
  connexionGoogle(): Promise<Resultat | 'annule'>;
  inscription(donnees: Inscription): Promise<Resultat>;
  choisirRole(type: TypeCompte): Promise<Resultat>;
  deconnexion(): Promise<void>;
};

const SessionContexte = createContext<Session | null>(null);

const echec = (e: unknown): Resultat => {
  if (__DEV__)
    console.warn('auth refusee', e instanceof AppwriteException ? `${e.type} ${e.message}` : e);
  return { ok: false, message: messageAuth(e instanceof AppwriteException ? e.type : undefined) };
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<Etat>({ utilisateur: null, role: null, chargement: true });

  // The session lives in the native cookie store, so a cold start reads it back here.
  const rafraichir = useCallback(async () => {
    try {
      const u = await compte.get();
      setEtat({
        utilisateur: { id: u.$id, email: u.email, nom: u.name },
        role: roleDe(u.labels),
        chargement: false,
      });
    } catch {
      setEtat({ utilisateur: null, role: null, chargement: false });
    }
  }, []);

  useEffect(() => {
    rafraichir();
  }, [rafraichir]);

  useEffect(() => quandSessionExpire(rafraichir), [rafraichir]);

  // The role goes to the function before the account is read again, so the guards never show the role screen mid sign-up.
  const envoyerRole = useCallback(
    async (type: TypeCompte, nomComplet: string, telephone: string): Promise<Resultat> => {
      const { prenom, nom } = separerNom(nomComplet);
      const r = await api<{ role: Role }>('/role', {
        type,
        prenom,
        nom,
        telephone,
        ville: '',
      });
      await rafraichir();
      return r.ok ? { ok: true } : { ok: false, message: r.message };
    },
    [rafraichir],
  );

  const session = useMemo<Session>(
    () => ({
      ...etat,
      async connexion(email, motDePasse) {
        try {
          await compte.createEmailPasswordSession({ email: email.trim(), password: motDePasse });
        } catch (e) {
          return echec(e);
        }
        await rafraichir();
        return { ok: true };
      },
      async connexionGoogle() {
        let idToken: string | null;
        try {
          idToken = await jetonGoogle();
        } catch (e) {
          if (__DEV__) console.warn('google refuse', e);
          return { ok: false, message: fr.auth.erreurs.google };
        }
        if (!idToken) return 'annule';
        try {
          // A first Google login creates an account without a role, so the guards open the role screen.
          await compte.createIdTokenSession({
            provider: IdTokenProvider.Google,
            idToken,
            nonce: nonceDuJeton(idToken),
          });
        } catch (e) {
          await oublierGoogle();
          const r = echec(e);
          return e instanceof AppwriteException && e.type
            ? { ok: false, message: fr.auth.erreurs.google }
            : r;
        }
        await rafraichir();
        return { ok: true };
      },
      async inscription({ email, motDePasse, nomComplet, telephone, type }) {
        try {
          await compte.create({
            userId: ID.unique(),
            email: email.trim(),
            password: motDePasse,
            name: nomComplet.trim(),
          });
          await compte.createEmailPasswordSession({ email: email.trim(), password: motDePasse });
        } catch (e) {
          return echec(e);
        }
        return envoyerRole(type, nomComplet, telephone);
      },
      choisirRole(type) {
        return envoyerRole(type, etat.utilisateur?.nom ?? '', '');
      },
      async deconnexion() {
        // Offline, the app still signs out, and the next start finds the session again only if the cookie survived.
        await compte.deleteSession({ sessionId: 'current' }).catch(() => undefined);
        await oublierGoogle();
        setEtat({ utilisateur: null, role: null, chargement: false });
      },
    }),
    [etat, envoyerRole, rafraichir],
  );

  return <SessionContexte.Provider value={session}>{children}</SessionContexte.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContexte);
  if (!session) throw new Error('useSession outside SessionProvider');
  return session;
}
