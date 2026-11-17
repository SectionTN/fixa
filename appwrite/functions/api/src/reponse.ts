import { type CodeErreur, MESSAGES_ERREUR, type ReponseApi } from '@fixa/core';

export const succes = <T>(data: T): ReponseApi<T> => ({ ok: true, data });

export const echec = (code: CodeErreur): { ok: false; code: CodeErreur; message: string } => ({
  ok: false,
  code,
  message: MESSAGES_ERREUR[code],
});

export const lire = (id: string) => `read("user:${id}")`;
export const modifier = (id: string) => `update("user:${id}")`;
