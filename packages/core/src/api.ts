import { type CodeErreur, MESSAGES_ERREUR, type ReponseApi } from './erreurs';
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

const echec = <T>(code: CodeErreur): ReponseApi<T> => ({
  ok: false,
  code,
  message: MESSAGES_ERREUR[code],
});

// Both SDKs throw an AppwriteException, with code 0 when the request never got an answer.
function codeLance(e: unknown): CodeErreur {
  const statut = (e as { code?: unknown } | null)?.code;
  if (statut === 401) return 'SESSION_EXPIREE';
  if (statut === undefined || statut === 0) return 'RESEAU';
  return 'REQUETE_INVALIDE';
}

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
    return estReponse<T>(reponse) ? reponse : echec('REQUETE_INVALIDE');
  } catch (e) {
    return echec(e instanceof SyntaxError ? 'REQUETE_INVALIDE' : codeLance(e));
  }
}
