import { MESSAGES_ERREUR, type ReponseApi } from './erreurs';
import { FONCTIONS } from './ids';

// The one method the web and React Native Functions services share, so core imports neither SDK.
export interface FonctionsLike {
  createExecution(params: {
    functionId: string;
    body?: string;
    async?: boolean;
    xpath?: string;
    headers?: Record<string, string>;
  }): Promise<{ responseBody: string; responseStatusCode: number }>;
}

const invalide = <T>(): ReponseApi<T> => ({
  ok: false,
  code: 'REQUETE_INVALIDE',
  message: MESSAGES_ERREUR.REQUETE_INVALIDE,
});

const estReponse = <T>(valeur: unknown): valeur is ReponseApi<T> =>
  typeof valeur === 'object' &&
  valeur !== null &&
  typeof (valeur as { ok?: unknown }).ok === 'boolean';

// Calls the api function synchronously. POST is the default method, which both SDKs type as an enum.
export async function appelerApi<T>(
  fonctions: FonctionsLike,
  route: string,
  corps: unknown,
): Promise<ReponseApi<T>> {
  try {
    const execution = await fonctions.createExecution({
      functionId: FONCTIONS.api,
      xpath: route,
      body: JSON.stringify(corps),
      async: false,
      headers: { 'content-type': 'application/json' },
    });
    const reponse: unknown = JSON.parse(execution.responseBody);
    return estReponse<T>(reponse) ? reponse : invalide();
  } catch {
    return invalide();
  }
}
