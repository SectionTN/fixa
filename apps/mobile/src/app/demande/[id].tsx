import { useLocalSearchParams, useRouter } from 'expo-router';
import { DetailDemande } from '../../composants/DetailDemande';
import { CadreLateral } from '../../composants/Ecran';

export default function EcranDemande() {
  const { id, refuser } = useLocalSearchParams<{ id: string; refuser?: string }>();
  const router = useRouter();
  return (
    <CadreLateral>
      <DetailDemande id={id} refuser={refuser === '1'} onRetour={() => router.back()} />
    </CadreLateral>
  );
}
