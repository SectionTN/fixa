import { BASE } from '@fixa/core';
import { dbAppwrite } from '@fixa/fn-commun';
import { Client } from 'node-appwrite';
import { executerTick } from './taches';

type Contexte = {
  req: { headers: Record<string, string | undefined> };
  res: { json: (corps: unknown, statut?: number) => unknown };
  log: (message: unknown) => void;
  error: (message: unknown) => void;
};

// Appwrite runs this on the cron in appwrite.config.json, with the function's runtime key.
export default async ({ req, res, log, error }: Contexte) => {
  const serveur = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT ?? '')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID ?? '')
    .setKey(req.headers['x-appwrite-key'] ?? '');
  try {
    const compte = await executerTick(dbAppwrite(serveur, BASE), new Date(), error);
    log(`expires ${compte.expires}, termines ${compte.termines}`);
    return res.json(compte);
  } catch (e) {
    error(e instanceof Error ? (e.stack ?? e.message) : String(e));
    return res.json({ expires: 0, termines: 0 }, 500);
  }
};
