import {
  appelerApi,
  type Categorie,
  type DossierAValider,
  formatPrixService,
  fr,
  heureLocale,
  ilYA,
  jourLocal,
  lireDossiersAValider,
  listerCategories,
} from '@fixa/core';
import { BadgeStatut, Bouton, EtatVide, Icone, Texte } from '@fixa/ui';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { fonctions, Query, tables } from '../appwrite';
import { EnTete, initiales } from './Coque';
import { DialogueRefus } from './DialogueRefus';

const t = fr.admin;
const JOUR_MS = 86_400_000;

type Lecture = { dossiers: DossierAValider[]; categories: Categorie[]; maintenant: Date };

const OMBRE = {
  shadowColor: 'shadow-color',
  shadowOffset: { width: 0, height: 1 },
  shadowRadius: 3,
} as const;

function Avatar({
  nom,
  couleur,
  taille,
  rayon,
  police,
}: {
  nom: string;
  couleur: string;
  taille: number;
  rayon: number;
  police: number;
}) {
  return (
    <XStack
      width={taille}
      height={taille}
      borderRadius={rayon}
      backgroundColor={`${couleur}-soft`}
      alignItems="center"
      justifyContent="center"
    >
      <Texte fontSize={police} fontWeight="600" color={couleur}>
        {initiales(nom)}
      </Texte>
    </XStack>
  );
}

function Info({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <YStack gap={3} paddingVertical={10} borderTopWidth={1} borderColor="border-color">
      <Texte fontSize="2" color="color-muted">
        {libelle}
      </Texte>
      {children}
    </YStack>
  );
}

// Provider sign-ups waiting for the admin: the list, the selected dossier, then validate or refuse.
export function Validation({
  onDecision,
  onSessionExpiree,
}: {
  onDecision: () => void;
  onSessionExpiree: () => void;
}) {
  const [misAJour, setMisAJour] = useState(() => new Date().toISOString());
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [erreurLecture, setErreurLecture] = useState(false);
  const [choisiId, setChoisiId] = useState<string | null>(null);
  const [refus, setRefus] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [annonce, setAnnonce] = useState<string | null>(null);
  const verrou = useRef(false);

  useEffect(() => {
    let actif = true;
    setErreurLecture(false);
    Promise.all([lireDossiersAValider(tables, Query), listerCategories(tables, Query)]).then(
      ([dossiers, categories]) =>
        actif && setLecture({ dossiers, categories, maintenant: new Date(misAJour) }),
      () => actif && setErreurLecture(true),
    );
    return () => {
      actif = false;
    };
  }, [misAJour]);

  const dossiers = lecture?.dossiers ?? [];
  const dossier = dossiers.find((d) => d.fournisseur.$id === choisiId) ?? dossiers[0] ?? null;
  const couleur = (categorieId: string) =>
    lecture?.categories.find((c) => c.$id === categorieId)?.couleur ?? 'cat1';
  const metier = (d: DossierAValider) =>
    d.profil?.specialites[0] ??
    lecture?.categories.find((c) => c.$id === d.fournisseur.categorieId)?.nom ??
    '';

  const choisir = (id: string) => {
    setChoisiId(id);
    setErreur(null);
  };

  // The decided dossier leaves the list at once, so it cannot be decided again while the list reloads.
  const retirer = (id: string, message: string) => {
    setLecture((l) => l && { ...l, dossiers: l.dossiers.filter((d) => d.fournisseur.$id !== id) });
    setChoisiId((c) => (c === id ? null : c));
    setRefus(false);
    setAnnonce(message);
    setMisAJour(new Date().toISOString());
    onDecision();
  };

  const decider = async (decision: 'valider' | 'refuser', motif?: string) => {
    if (!dossier || verrou.current) return;
    verrou.current = true;
    setEnvoi(true);
    setErreur(null);
    setAnnonce(null);
    const { $id, nom } = dossier.fournisseur;
    const r = await appelerApi<unknown>(
      fonctions,
      `/admin/fournisseurs/${$id}/${decision}`,
      motif === undefined ? {} : { motif },
    );
    verrou.current = false;
    setEnvoi(false);
    if (r.ok) retirer($id, decision === 'valider' ? t.dossierValide(nom) : t.dossierRefuse(nom));
    else if (r.code === 'DOSSIER_TRAITE') retirer($id, r.message);
    else {
      if (r.code === 'SESSION_EXPIREE') onSessionExpiree();
      setErreur(r.message);
    }
  };

  const plusAncien = dossiers.at(-1);
  const sousTitre = !lecture
    ? ''
    : plusAncien
      ? `${t.dossiers(dossiers.length)} · ${t.plusAncien(
          Math.floor(
            (lecture.maintenant.getTime() - Date.parse(plusAncien.fournisseur.$createdAt)) /
              JOUR_MS,
          ),
        )}`
      : t.aucunDossier;

  return (
    <YStack flex={1}>
      <EnTete titre={t.validationTitre} sousTitre={sousTitre} />
      <YStack flex={1} paddingVertical={28} paddingHorizontal="7">
        {/* Mounted empty, so screen readers announce the message when it arrives. */}
        <XStack gap="2" alignItems="center" role="status" marginBottom={annonce ? '4' : 0}>
          {annonce ? (
            <>
              <Icone nom="task_alt" taille={20} couleur="completed" />
              <Texte fontSize="4" color="completed">
                {annonce}
              </Texte>
            </>
          ) : null}
        </XStack>
        {erreurLecture ? (
          <XStack gap="3" alignItems="center" role="alert" marginBottom="4">
            <Icone nom="error" taille={20} couleur="cancelled" />
            <Texte fontSize="4" color="cancelled">
              {t.dossiersIndisponibles}
            </Texte>
            <Bouton
              variante="outline"
              taille="sm"
              onPress={() => setMisAJour(new Date().toISOString())}
            >
              {t.reessayer}
            </Bouton>
          </XStack>
        ) : null}
        {lecture && !dossier ? (
          <YStack flex={1} borderRadius="5" backgroundColor="surface" {...OMBRE}>
            <EtatVide icone="how_to_reg" titre={t.aucunDossier} texte={t.aucunDossierTexte} />
          </YStack>
        ) : null}
        {lecture && dossier ? (
          <XStack flex={1} gap="5" alignItems="stretch">
            <YStack
              width={380}
              padding="4"
              gap="3"
              borderRadius="5"
              backgroundColor="surface"
              {...OMBRE}
            >
              {dossiers.map((d) => {
                const choisi = d === dossier;
                return (
                  <XStack
                    key={d.fournisseur.$id}
                    render="button"
                    role="button"
                    aria-current={choisi || undefined}
                    padding="3"
                    gap="3"
                    borderWidth={0}
                    borderRadius={18}
                    alignItems="center"
                    cursor="pointer"
                    backgroundColor={choisi ? 'primary-soft' : 'transparent hover:background-hover'}
                    onPress={() => choisir(d.fournisseur.$id)}
                  >
                    <Avatar
                      nom={d.fournisseur.nom}
                      couleur={couleur(d.fournisseur.categorieId)}
                      taille={44}
                      rayon={14}
                      police={15}
                    />
                    <YStack flex={1} gap={2} minWidth={0} alignItems="flex-start">
                      <Texte fontSize="4" fontWeight="600" numberOfLines={1}>
                        {d.fournisseur.nom}
                      </Texte>
                      <Texte fontSize="2" color="color-muted" numberOfLines={1}>
                        {`${metier(d)} · ${d.fournisseur.ville}`}
                      </Texte>
                    </YStack>
                    <Texte fontSize="2" color="color-subtle">
                      {ilYA(d.fournisseur.$createdAt, lecture.maintenant)}
                    </Texte>
                  </XStack>
                );
              })}
            </YStack>
            <Detail
              dossier={dossier}
              metier={metier(dossier)}
              couleur={couleur(dossier.fournisseur.categorieId)}
              envoi={envoi}
              erreur={refus ? null : erreur}
              onValider={() => decider('valider')}
              onRefuser={() => {
                setErreur(null);
                setRefus(true);
              }}
            />
          </XStack>
        ) : null}
      </YStack>
      {refus && dossier ? (
        <DialogueRefus
          nom={dossier.fournisseur.nom}
          envoi={envoi}
          erreur={erreur}
          onFermer={() => {
            setRefus(false);
            setErreur(null);
          }}
          onRefuser={(motif) => decider('refuser', motif)}
        />
      ) : null}
    </YStack>
  );
}

function Detail({
  dossier,
  metier,
  couleur,
  envoi,
  erreur,
  onValider,
  onRefuser,
}: {
  dossier: DossierAValider;
  metier: string;
  couleur: string;
  envoi: boolean;
  erreur: string | null;
  onValider: () => void;
  onRefuser: () => void;
}) {
  const { fournisseur, profil, services } = dossier;
  const telephone = profil?.telephone ?? '';
  const envoye = fournisseur.$createdAt;
  return (
    <YStack flex={1} borderRadius="5" backgroundColor="surface" overflow="hidden" {...OMBRE}>
      <YStack flex={1} paddingVertical={22} paddingHorizontal="6" gap={18}>
        <XStack gap={14} alignItems="center">
          <Avatar nom={fournisseur.nom} couleur={couleur} taille={60} rayon={20} police={20} />
          <YStack flex={1} gap="1">
            <Texte render="h2" margin={0} fontSize={22} fontWeight="600">
              {fournisseur.nom}
            </Texte>
            <Texte fontSize="4" color="color-muted">
              {`${metier} · ${fournisseur.ville} · ${t.dossierEnvoye(jourLocal(envoye), heureLocale(envoye))}`}
            </Texte>
          </YStack>
          <YStack>
            <BadgeStatut statut="EN_ATTENTE" libelle={t.aVerifier} />
          </YStack>
          {telephone ? (
            <Bouton
              variante="outline"
              taille="sm"
              icone="call"
              onPress={() => {
                window.location.href = `tel:${telephone.replace(/\s/g, '')}`;
              }}
            >
              {t.appeler}
            </Bouton>
          ) : null}
        </XStack>
        <XStack gap="6" alignItems="flex-start">
          <YStack width={320}>
            <Texte fontSize={15} fontWeight="600" paddingBottom="2">
              {t.informations}
            </Texte>
            <Info libelle={t.telephone}>
              <Texte fontSize="4" fontWeight="500">
                {telephone || t.nonRenseigne}
              </Texte>
            </Info>
            <Info libelle={t.zone}>
              <Texte fontSize="4" fontWeight="500">
                {fournisseur.ville}
              </Texte>
            </Info>
            {services.length > 0 ? (
              <Info libelle={t.services}>
                {services.map((s) => (
                  <Texte key={s.$id} fontSize="4" fontWeight="500">
                    {`${s.titre} · ${formatPrixService(s)}`}
                  </Texte>
                ))}
              </Info>
            ) : null}
            {profil?.description ? (
              <Info libelle={t.presentation}>
                <Texte fontSize="4" fontWeight="500">
                  {profil.description}
                </Texte>
              </Info>
            ) : null}
          </YStack>
          <YStack flex={1} gap="2">
            <Texte fontSize={15} fontWeight="600">
              {t.documents}
            </Texte>
            <XStack
              padding="3"
              gap="3"
              borderRadius={18}
              borderWidth={1}
              borderColor="border-color"
              alignItems="center"
            >
              <XStack
                width={40}
                height={40}
                borderRadius={12}
                backgroundColor="secondary-soft"
                alignItems="center"
                justifyContent="center"
              >
                <Icone nom="description" taille={21} couleur="secondary" />
              </XStack>
              <YStack flex={1} gap={2}>
                <Texte fontSize="4" fontWeight="600">
                  {t.justificatifs}
                </Texte>
                <Texte fontSize="2" color="color-muted">
                  {t.justificatifsBientot}
                </Texte>
              </YStack>
            </XStack>
          </YStack>
        </XStack>
      </YStack>
      <XStack
        paddingVertical="4"
        paddingHorizontal="6"
        gap={10}
        alignItems="center"
        borderTopWidth={1}
        borderColor="border-color"
      >
        <XStack flex={1} gap="2" alignItems="center" role={erreur ? 'alert' : undefined}>
          {erreur ? (
            <>
              <Icone nom="error" taille={18} couleur="cancelled" />
              <Texte fontSize="4" color="cancelled">
                {erreur}
              </Texte>
            </>
          ) : null}
        </XStack>
        <Bouton variante="danger" desactive={envoi} onPress={onRefuser}>
          {t.refuser}
        </Bouton>
        <Bouton icone="check" desactive={envoi} onPress={onValider}>
          {t.valider}
        </Bouton>
      </XStack>
    </YStack>
  );
}
