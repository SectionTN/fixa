import { textes } from '@fixa/core';
import { Bouton, Texte } from '@fixa/ui';
import { Ecran } from '../composants/Ecran';
import { useSession } from '../lib/session';

export default function AdminSurMobile() {
  const { deconnexion } = useSession();
  return (
    <Ecran padding="6" gap="6" justifyContent="center">
      <Texte fontSize="7" fontWeight="600" textAlign="center">
        {textes.auth.admin.mobile}
      </Texte>
      <Bouton taille="lg" variante="outline" icone="logout" onPress={deconnexion}>
        {textes.auth.profil.deconnexion}
      </Bouton>
    </Ecran>
  );
}
