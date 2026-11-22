import {
  ajouterJours,
  dateLocale,
  formatNote,
  fr,
  getFournisseur,
  heureLocale,
  JOURS_RECHERCHE,
  nbARepondre,
} from '@fixa/core';
import { BadgeStatut, Bouton, Icone, Texte } from '@fixa/ui';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { Ecran } from '../../composants/Ecran';
import { tables } from '../../lib/appwrite';
import { repondre, useDemandes, useVersion } from '../../lib/demandes';
import { useLecture } from '../../lib/donnees';
import { useSession } from '../../lib/session';

const t = fr.espacePro;

function Chiffre({ valeur, libelle }: { valeur: string; libelle: string }) {
  return (
    <YStack flex={1} padding="3" gap={4} borderRadius="5" backgroundColor="surface">
      <Texte fontSize="8" fontWeight="600">
        {valeur}
      </Texte>
      <Texte fontSize="2" color="color-muted" numberOfLines={2}>
        {libelle}
      </Texte>
    </YStack>
  );
}

// The provider home for the demo: the counts that matter and today's confirmed appointments.
export default function Accueil() {
  const router = useRouter();
  const { utilisateur } = useSession();
  const uid = utilisateur?.id ?? '';
  const demandes = useDemandes();
  const version = useVersion();
  const fiche = useLecture(`fiche:${uid}`, () => getFournisseur(tables, uid), version);
  const [message, setMessage] = useState<string | null>(null);
  const verrou = useRef(false);

  const d = demandes.donnees;
  const maintenant = d?.maintenant ?? new Date();
  const jour = dateLocale(maintenant.toISOString());
  const finSemaine = ajouterJours(jour, JOURS_RECHERCHE);
  const liste = d?.liste ?? [];
  const aRepondre = nbARepondre(liste, maintenant);
  const semaine = liste.filter(
    (r) =>
      r.statut === 'CONFIRME' && dateLocale(r.debut) >= jour && dateLocale(r.debut) < finSemaine,
  );
  const aujourdhui = semaine
    .filter((r) => dateLocale(r.debut) === jour)
    .sort((a, b) => a.debut.localeCompare(b.debut));
  const prenom = (utilisateur?.nom ?? '').split(/\s+/)[0] ?? '';

  const terminer = async (id: string) => {
    if (verrou.current) return;
    verrou.current = true;
    setMessage(null);
    const r = await repondre(id, 'terminer');
    verrou.current = false;
    if (!r.ok) setMessage(r.message);
  };

  return (
    <Ecran paddingTop="2" paddingHorizontal="5" paddingBottom="6" gap="5">
      <Texte fontSize="9" fontWeight="600" paddingTop="1">
        {t.bonjour(prenom)}
      </Texte>
      <XStack gap="3">
        <Chiffre valeur={String(aRepondre)} libelle={t.enAttente} />
        <Chiffre
          valeur={fiche.donnees ? formatNote(fiche.donnees.noteMoyenne) : '-'}
          libelle={t.note(fiche.donnees?.nbAvis ?? 0)}
        />
        <Chiffre valeur={String(semaine.length)} libelle={t.semaine} />
      </XStack>
      {aRepondre > 0 ? (
        <Bouton variante="soft" icone="inbox" onPress={() => router.navigate('/demandes')}>
          {t.voirDemandes(aRepondre)}
        </Bouton>
      ) : null}

      <Texte fontSize="6" fontWeight="600">
        {t.aujourdhui(aujourdhui.length)}
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
      {aujourdhui.length === 0 ? (
        <Texte fontSize="4" color="color-muted">
          {t.aucunAujourdhui}
        </Texte>
      ) : (
        aujourdhui.map((r) => {
          const commence = Date.parse(r.debut) <= maintenant.getTime();
          return (
            <YStack key={r.$id} padding="4" gap="3" borderRadius="5" backgroundColor="surface">
              <XStack gap="4" alignItems="center">
                <Texte fontSize="7" fontWeight="600">
                  {heureLocale(r.debut)}
                </Texte>
                <YStack flex={1} gap={2}>
                  <Texte fontSize="5" fontWeight="600" numberOfLines={1}>
                    {r.clientNom}
                  </Texte>
                  <Texte fontSize="3" color="color-muted" numberOfLines={1}>
                    {[r.serviceTitre, r.adresse].filter(Boolean).join(' · ')}
                  </Texte>
                </YStack>
                <BadgeStatut statut="CONFIRME" libelle={fr.statuts.CONFIRME} />
              </XStack>
              {commence ? (
                <Bouton
                  variante="outline"
                  taille="sm"
                  icone="task_alt"
                  onPress={() => terminer(r.$id)}
                >
                  {t.marquerTermine}
                </Bouton>
              ) : null}
            </YStack>
          );
        })
      )}
    </Ecran>
  );
}
