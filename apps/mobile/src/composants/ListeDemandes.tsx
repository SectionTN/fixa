import { fr, nbARepondre, type OngletDemande, ongletDemande } from '@fixa/core';
import { EtatVide, Icone, Texte } from '@fixa/ui';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { repondre, useDemandes } from '../lib/demandes';
import { CarteRdvPro } from './CarteRdvPro';
import { BORDS_ECRAN, MARGE_HAUT_MIN } from './Ecran';
import { useBasOnglets } from './Onglet';
import { ErreurChargement } from './Section';

const t = fr.demandes;
const ONGLETS: OngletDemande[] = ['attente', 'acceptees', 'refusees'];

// The provider's requests in three tabs, read again on every visit and on every live booking change.
export function ListeDemandes({ onOuvrir }: { onOuvrir?: (id: string, refuser: boolean) => void }) {
  const lecture = useDemandes();
  const bas = useBasOnglets();
  const d = lecture.donnees;
  const [onglet, setOnglet] = useState<OngletDemande>('attente');
  const [message, setMessage] = useState<string | null>(null);
  const [occupe, setOccupe] = useState<string | null>(null);
  const verrou = useRef(false);
  const dejaVu = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (dejaVu.current) lecture.recharger();
      dejaVu.current = true;
    }, [lecture.recharger]),
  );

  const accepter = async (id: string) => {
    if (verrou.current) return;
    verrou.current = true;
    setOccupe(id);
    setMessage(null);
    const r = await repondre(id, 'accepter');
    verrou.current = false;
    setOccupe(null);
    if (!r.ok) setMessage(r.message);
  };

  const parOnglet = (o: OngletDemande) =>
    (d?.liste ?? [])
      .filter((r) => ongletDemande(r.statut) === o)
      .sort((a, b) => a.debut.localeCompare(b.debut));
  const visibles = parOnglet(onglet);
  const nbAttente = d ? nbARepondre(d.liste, d.maintenant) : 0;

  return (
    <YStack flex={1} backgroundColor="background">
      <SafeAreaView edges={BORDS_ECRAN} style={{ flex: 1, paddingTop: MARGE_HAUT_MIN }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 20 + bas,
            gap: 14,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={lecture.recharger} />}
        >
          <Texte fontSize="9" fontWeight="600" paddingTop="1">
            {t.titre}
          </Texte>
          <XStack padding={5} borderRadius="round" backgroundColor="background-soft" role="tablist">
            {ONGLETS.map((o) => {
              const actif = o === onglet;
              return (
                <XStack
                  key={o}
                  role="tab"
                  accessible
                  aria-selected={actif}
                  flex={1}
                  height={44}
                  gap="2"
                  borderRadius="round"
                  backgroundColor={actif ? 'surface' : 'transparent'}
                  alignItems="center"
                  justifyContent="center"
                  onPress={() => setOnglet(o)}
                >
                  <Texte
                    fontSize="4"
                    fontWeight={actif ? '600' : '500'}
                    color={actif ? 'color' : 'color-muted'}
                  >
                    {t.onglets[o]}
                  </Texte>
                  {o === 'attente' && nbAttente > 0 ? (
                    <XStack
                      minWidth={22}
                      height={22}
                      paddingHorizontal={6}
                      borderRadius="round"
                      backgroundColor="primary"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Texte fontSize="2" fontWeight="600" color="on-primary">
                        {nbAttente}
                      </Texte>
                    </XStack>
                  ) : null}
                </XStack>
              );
            })}
          </XStack>
          <Texte fontSize="3" color="color-muted">
            {t.triees}
          </Texte>

          {message ? (
            <XStack
              padding="3"
              gap="2"
              borderRadius="4"
              backgroundColor="cancelled-soft"
              alignItems="center"
              role="alert"
            >
              <Icone nom="error" taille={18} couleur="cancelled" />
              <Texte flex={1} fontSize="4" color="cancelled">
                {message}
              </Texte>
            </XStack>
          ) : null}
          {lecture.erreur && !d ? <ErreurChargement onReessayer={lecture.recharger} /> : null}

          {d
            ? visibles.map((rdv) => (
                <CarteRdvPro
                  key={rdv.$id}
                  rdv={rdv}
                  maintenant={d.maintenant}
                  occupe={occupe === rdv.$id}
                  onAccepter={accepter}
                  onOuvrir={onOuvrir}
                />
              ))
            : null}
          {d && visibles.length === 0 ? (
            <YStack flex={1} justifyContent="center" paddingBottom="9">
              <EtatVide icone="inbox" titre={t.vide[onglet]} texte={t.videTexte} />
            </YStack>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </YStack>
  );
}
