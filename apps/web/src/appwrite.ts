import { APPWRITE } from '@fixa/core';
import { Account, Client, Query, TablesDB } from 'appwrite';

export const client = new Client().setEndpoint(APPWRITE.endpoint).setProject(APPWRITE.projet);
export const compte = new Account(client);
export const tables = new TablesDB(client);
export { Query };
