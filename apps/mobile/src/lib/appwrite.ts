import 'react-native-url-polyfill/auto';
import { APPWRITE } from '@fixa/core';
import { Account, Client, Functions, TablesDB } from 'react-native-appwrite';

export const client = new Client()
  .setEndpoint(APPWRITE.endpoint)
  .setProject(APPWRITE.projet)
  .setPlatform(APPWRITE.plateforme);

export const compte = new Account(client);
export const fonctions = new Functions(client);
export const tables = new TablesDB(client);
