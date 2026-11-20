import { fr } from '@fixa/core';
import { Compte as CarteCompte } from '../../composants/Compte';

export default function Compte() {
  return <CarteCompte titre={fr.onglets.compte} />;
}
