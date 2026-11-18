import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// Client ids are public. The web one becomes the token audience that Appwrite checks.
GoogleSignin.configure({
  webClientId: '50035838261-0ohtdk505c4denl5o78t4e28a55abuj6.apps.googleusercontent.com',
  iosClientId: '50035838261-73ornk942ad453vo5h1n88a3hek3kckj.apps.googleusercontent.com',
});

// Resolves to the ID token, or null when the user closed the Google sheet.
export async function jetonGoogle(): Promise<string | null> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const reponse = await GoogleSignin.signIn();
    if (!isSuccessResponse(reponse)) return null;
    if (!reponse.data.idToken) throw new Error('Google returned no idToken');
    return reponse.data.idToken;
  } catch (e) {
    if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) return null;
    throw e;
  }
}

// Without it the next tap signs back into the last Google account with no picker.
export const oublierGoogle = () => GoogleSignin.signOut().catch(() => undefined);
