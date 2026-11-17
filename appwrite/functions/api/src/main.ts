import { BASE } from '@fixa/core';
import { dbAppwrite } from '@fixa/fn-commun';
import { Account, Client } from 'node-appwrite';
import { echec } from './reponse';
import { type Appelant, router } from './routeur';

type Contexte = {
  req: {
    method: string;
    path: string;
    headers: Record<string, string | undefined>;
    readonly bodyJson: unknown;
  };
  res: { json: (corps: unknown, statut?: number) => unknown };
  error: (message: unknown) => void;
};

function lireCorps(req: Contexte['req']): unknown {
  try {
    return req.bodyJson;
  } catch {
    return null;
  }
}

// The user id comes from the session JWT that Appwrite attaches, not from any header the caller sets.
async function identifier(
  endpoint: string,
  projet: string,
  jwt: string | undefined,
  journal: Contexte['error'],
): Promise<Appelant> {
  if (!jwt) return null;
  try {
    const client = new Client().setEndpoint(endpoint).setProject(projet).setJWT(jwt);
    const compte = await new Account(client).get();
    return { id: compte.$id, labels: compte.labels };
  } catch (e) {
    journal(`identification refusee: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

export default async ({ req, res, error }: Contexte) => {
  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT ?? '';
  const projet = process.env.APPWRITE_FUNCTION_PROJECT_ID ?? '';
  try {
    const appelant = await identifier(endpoint, projet, req.headers['x-appwrite-user-jwt'], error);
    const serveur = new Client()
      .setEndpoint(endpoint)
      .setProject(projet)
      .setKey(req.headers['x-appwrite-key'] ?? '');
    const { statut, corps } = await router(
      dbAppwrite(serveur, BASE),
      appelant,
      req.method,
      req.path,
      lireCorps(req),
      new Date(),
    );
    return res.json(corps, statut);
  } catch (e) {
    error(e instanceof Error ? (e.stack ?? e.message) : String(e));
    return res.json(echec('REQUETE_INVALIDE'), 500);
  }
};
