import { describe, expect, it } from 'vitest';
import { appelerApi, type FonctionsLike } from '../src/api';
import { MESSAGES_ERREUR } from '../src/erreurs';

type Execution = { responseBody: string; responseStatusCode: number };

function fonctions(reponse: () => Promise<Execution>) {
  const appels: unknown[] = [];
  const f: FonctionsLike = {
    createExecution: async (params) => {
      appels.push(params);
      return reponse();
    },
  };
  return { f, appels };
}

const invalide = {
  ok: false,
  code: 'REQUETE_INVALIDE',
  message: MESSAGES_ERREUR.REQUETE_INVALIDE,
};

describe('appelerApi', () => {
  it('envoie la route et le corps en JSON a la fonction api, en synchrone', async () => {
    const { f, appels } = fonctions(async () => ({
      responseBody: '{"ok":true,"data":{"role":"client"}}',
      responseStatusCode: 200,
    }));
    const r = await appelerApi<{ role: string }>(f, '/role', { type: 'client' });
    expect(r).toEqual({ ok: true, data: { role: 'client' } });
    expect(appels).toEqual([
      {
        functionId: 'api',
        xpath: '/role',
        body: '{"type":"client"}',
        async: false,
        headers: { 'content-type': 'application/json' },
      },
    ]);
  });

  it('rend une erreur metier de la fonction telle quelle', async () => {
    const corps = { ok: false, code: 'CRENEAU_PRIS', message: MESSAGES_ERREUR.CRENEAU_PRIS };
    const { f } = fonctions(async () => ({
      responseBody: JSON.stringify(corps),
      responseStatusCode: 409,
    }));
    expect(await appelerApi(f, '/rendez-vous', {})).toEqual(corps);
  });

  it('transforme une panne de transport en REQUETE_INVALIDE', async () => {
    const { f } = fonctions(async () => {
      throw new Error('Network request failed');
    });
    expect(await appelerApi(f, '/avis', {})).toEqual(invalide);
  });

  it.each(['', '<html>502</html>', '{}', '{"ok":"oui"}'])(
    'transforme un corps illisible (%j) en REQUETE_INVALIDE',
    async (responseBody) => {
      const { f } = fonctions(async () => ({ responseBody, responseStatusCode: 500 }));
      expect(await appelerApi(f, '/avis', {})).toEqual(invalide);
    },
  );
});
