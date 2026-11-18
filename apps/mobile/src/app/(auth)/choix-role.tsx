import { useRouter } from 'expo-router';
import { ChoixRole } from '../../composants/ChoixRole';

// The role choice before sign-up: it rides along to the sign-up form.
export default function ChoixRoleAvantInscription() {
  const router = useRouter();
  return (
    <ChoixRole
      onRetour={() => router.back()}
      onContinuer={(role) => router.push({ pathname: '/inscription', params: { role } })}
    />
  );
}
