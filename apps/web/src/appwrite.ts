import { APPWRITE } from '@fixa/core';
import { Account, Client, Functions, Query, TablesDB } from 'appwrite';

export const client = new Client().setEndpoint(APPWRITE.endpoint).setProject(APPWRITE.projet);
export const compte = new Account(client);
export const tables = new TablesDB(client);
export const fonctions = new Functions(client);
export { Query };
