import { Stack } from 'expo-router';

export const unstable_settings = { anchor: 'demandes' };

export default function FournisseurLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
