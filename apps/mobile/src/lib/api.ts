import { appelerApi, type ReponseApi } from '@fixa/core';
import { fonctions } from './appwrite';

let surExpiration: (() => void) | null = null;

// The session provider registers here, so a revoked session signs the app out wherever it shows up.
export function quandSessionExpire(action: () => void): () => void {
  surExpiration = action;
  return () => {
    if (surExpiration === action) surExpiration = null;
  };
}

export async function api<T>(route: string, corps: unknown): Promise<ReponseApi<T>> {
  const r = await appelerApi<T>(fonctions, route, corps);
  if (!r.ok && r.code === 'SESSION_EXPIREE') surExpiration?.();
  return r;
}
