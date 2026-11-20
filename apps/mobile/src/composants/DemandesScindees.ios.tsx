import { Host } from '@expo/ui';
import { ArrangementView, RNHostView } from '@expo/ui/swift-ui';
import { arrangementViewStyle } from '@expo/ui/swift-ui/modifiers';
import { fr } from '@fixa/core';
import { EtatVide } from '@fixa/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { YStack } from 'tamagui';
import { DetailDemande } from './DetailDemande';
import { CadreLateral } from './Ecran';
import { ListeDemandes } from './ListeDemandes';

const t = fr.demandes;

// ArrangementView ships with iOS 27.1, below that @expo/ui would stack both panes.
const AVEC_ARRANGEMENT = Number.parseFloat(String(Platform.Version)) >= 27.1;

type Choix = { id: string; refuser: boolean; n: number };

// The list, with the chosen request beside it where the system splits the screen, such as the iPhone Duo inner panel.
export function DemandesScindees() {
  const router = useRouter();
  const [choix, setChoix] = useState<Choix | null>(null);
  const [largeurs, setLargeurs] = useState({ ecran: 0, liste: 0 });
  // The list pane is always laid out, so a list narrower than the screen means the detail pane holds the rest.
  const detailAffiche = largeurs.liste > 0 && largeurs.liste < largeurs.ecran - 1;

  if (!AVEC_ARRANGEMENT) return <ListeDemandes />;

  const ouvrir = (id: string, refuser: boolean) => {
    if (detailAffiche) {
      // Tapping the open request again keeps its state, Refuser remounts it with the sheet up.
      setChoix((c) => (c && c.id === id && !refuser ? c : { id, refuser, n: (c?.n ?? 0) + 1 }));
      return;
    }
    router.push({ pathname: '/demande/[id]', params: refuser ? { id, refuser: '1' } : { id } });
  };

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) => {
        const ecran = e.nativeEvent.layout.width;
        setLargeurs((l) => ({ ...l, ecran }));
      }}
    >
      <Host style={{ flex: 1 }} ignoreSafeArea="all">
        <ArrangementView modifiers={[arrangementViewStyle('split', { axes: 'horizontal' })]}>
          <ArrangementView.Primary>
            <RNHostView
              onLayout={(e) => {
                const liste = e.nativeEvent.layout.width;
                setLargeurs((l) => ({ ...l, liste }));
              }}
            >
              <View style={{ flex: 1 }}>
                <ListeDemandes onOuvrir={ouvrir} />
              </View>
            </RNHostView>
          </ArrangementView.Primary>
          <ArrangementView.Secondary>
            <RNHostView>
              <View style={{ flex: 1 }}>
                <CadreLateral>
                  {choix ? (
                    <DetailDemande
                      key={`${choix.id}:${choix.n}`}
                      id={choix.id}
                      refuser={choix.refuser}
                    />
                  ) : (
                    <YStack flex={1} justifyContent="center" paddingHorizontal="5">
                      <EtatVide icone="inbox" titre={t.choisir} texte={t.choisirTexte} />
                    </YStack>
                  )}
                </CadreLateral>
              </View>
            </RNHostView>
          </ArrangementView.Secondary>
        </ArrangementView>
      </Host>
    </View>
  );
}
