import { type TableauDeBord as Comptes, fr, heureLocale, jourLocal } from '@fixa/core';
import { Bouton, CarteStat, Icone, Texte } from '@fixa/ui';
import { XStack, YStack } from 'tamagui';

const t = fr.admin;
const nombre = new Intl.NumberFormat('fr-FR');

const titreDuJour = (iso: string) => {
  const jour = jourLocal(iso);
  return `${jour.charAt(0).toUpperCase()}${jour.slice(1)} ${iso.slice(0, 4)}`;
};

// The admin dashboard for the demo: the four counts and the providers waiting for validation.
export function TableauDeBord({
  comptes,
  anciennete,
  misAJour,
  erreur,
  onReessayer,
}: {
  comptes: Comptes | null;
  anciennete: number | null;
  misAJour: string;
  erreur: boolean;
  onReessayer: () => void;
}) {
  const valeur = (n: number | undefined) => (n === undefined ? '-' : nombre.format(n));
  const mois = fr.temps.moisCourts[new Date(misAJour).getUTCMonth()];
  return (
    <YStack flex={1}>
      <XStack
        height={76}
        paddingHorizontal="7"
        gap={14}
        alignItems="center"
        backgroundColor="surface"
        borderBottomWidth={1}
        borderColor="border-color"
      >
        <YStack>
          <Texte render="h1" margin={0} fontSize={22} lineHeight="30px" fontWeight="600">
            {t.tableauDeBord}
          </Texte>
          <Texte fontSize="3" color="color-muted">
            {`${titreDuJour(misAJour)} · ${t.misAJour} ${heureLocale(misAJour)}`}
          </Texte>
        </YStack>
      </XStack>
      <YStack paddingVertical={28} paddingHorizontal="7" gap="6">
        {erreur ? (
          <XStack gap="3" alignItems="center" role="alert">
            <Icone nom="error" taille={20} couleur="cancelled" />
            <Texte fontSize="4" color="cancelled">
              {t.erreurChargement}
            </Texte>
            <Bouton variante="outline" taille="sm" onPress={onReessayer}>
              {t.reessayer}
            </Bouton>
          </XStack>
        ) : null}
        <XStack gap="5">
          <CarteStat
            icone="group"
            fond="secondary-soft"
            teinte="secondary"
            libelle={t.utilisateurs}
            valeur={valeur(comptes?.utilisateurs)}
          />
          <CarteStat
            icone="handyman"
            fond="cat1-soft"
            teinte="cat1"
            libelle={t.prestatairesActifs}
            valeur={valeur(comptes?.fournisseursActifs)}
          />
          <CarteStat
            icone="event_available"
            fond="confirmed-soft"
            teinte="confirmed"
            libelle={`${t.reservations} (${mois})`}
            valeur={valeur(comptes?.rendezVousMois)}
          />
          <CarteStat
            icone="payments"
            fond="completed-soft"
            teinte="completed"
            libelle={t.revenus}
            valeur={t.bientot}
          />
        </XStack>
        <YStack padding="5" gap="4" borderRadius="5" backgroundColor="surface">
          <Texte fontSize="5" fontWeight="600">
            {t.aTraiter}
          </Texte>
          <XStack paddingVertical={11} gap="3" alignItems="center">
            <XStack
              width={38}
              height={38}
              borderRadius={12}
              backgroundColor="pending-soft"
              alignItems="center"
              justifyContent="center"
            >
              <Icone nom="how_to_reg" taille={20} couleur="pending" />
            </XStack>
            <YStack flex={1}>
              <Texte fontSize="4" fontWeight="600">
                {comptes === null
                  ? '-'
                  : comptes.aValider > 0
                    ? t.dossiers(comptes.aValider)
                    : t.aucunDossier}
              </Texte>
              {anciennete !== null ? (
                <Texte fontSize="2" color="color-muted">
                  {t.plusAncien(anciennete)}
                </Texte>
              ) : null}
            </YStack>
            <Icone nom="chevron_right" taille={20} couleur="color-subtle" />
          </XStack>
        </YStack>
      </YStack>
    </YStack>
  );
}
