# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

PWA installable (manifest `standalone`, orientation portrait, service worker hors ligne). **Mobile d'abord** : l'usage principal est la PWA installée sur le téléphone ; le desktop sert au point mensuel et aux simulations posées.

## Users

**Primaire : les freelances français en micro-entreprise qui facturent au TJM** (consultants, développeurs, designers, formateurs ; majoritairement libéral SSI). Le calendrier des jours travaillés est le cœur de leur saisie.

Secondaire, supporté mais non prioritaire : les autres profils micro (prestations au forfait, CA mensuel agrégé pour e-commerce / VTC / loueur meublé, mode mixte, multi-activités).

Leurs situations d'usage, toutes confirmées :

- **Pointage au fil de l'eau** : cocher ses jours travaillés chaque semaine, sur mobile.
- **Point mensuel** : vérifier le CA du mois, préparer la déclaration URSSAF, provisionner.
- **Simulations « et si »** : changer de TJM, activer le VL ou l'ACRE, passer à la TVA, ajouter une activité.
- **Suivi de trésorerie** : savoir quand l'argent des factures arrive réellement.
- **Identifier les sommes à prévoir** pour les paiements à venir (URSSAF, impôt, TVA, rattrapage de versement libératoire).

## Product Purpose

Fiscal Architect transforme un calendrier de jours travaillés en image fiscale complète d'une micro-entreprise : chiffre d'affaires, cotisations, impôt, net réel, seuils, TVA, encaissements et sommes à provisionner, sur plusieurs années.

**La question que l'app doit trancher en premier à l'ouverture : « Combien je gagne vraiment ? »** — le net après URSSAF, impôt et charges, sur le mois et sur l'année.

Succès : le freelance sait à tout moment ce qu'il lui reste réellement, ce qu'il doit mettre de côté, quand il franchira un seuil et quand l'argent arrivera, sans tableur ni comptable pour les questions courantes.

## Positioning

- **100 % local** : pas de backend, pas de compte, pas de tracking ; les données restent dans le navigateur (`localStorage`). Open source (MIT).
- **Du jour travaillé au net** : la saisie se fait dans un calendrier au jour près (plein / demi-journée, fériés et week-ends verrouillés), et tout le reste en découle.
- **Modélisation fiscale française complète et datée** : URSSAF par activité, CFP, taxe consulaire, ACRE, IJ libérales, IR au barème vs versement libératoire avec éligibilité RFR, seuils micro et franchise TVA avec date de franchissement projetée, TVA à partir d'une date, délais de paiement (nets / fin de mois, deux méthodes), régularisation du VL, multi-années.

## Operating Context

- Calendrier fiscal français : déclarations URSSAF mensuelles ou trimestrielles ; RFR de l'année N-2 lu sur l'avis d'impôt reçu en N-1 ; facture récapitulative supposée émise le dernier jour du mois de prestation ; jours fériés de métropole.
- Paramètres légaux par année (taux URSSAF, plafond micro, plafond RFR par part) codés dans `src/constants.ts` et `src/lib/vlEligibility.ts`.
- Sources officielles citées dans l'app : impots.gouv.fr, URSSAF, Service-Public.fr.
- Export CSV annuel, sauvegarde/restauration locale au format `.fiscal-architect-backup` (JSON).

## Capabilities and Constraints

**Fonctionnalités à préserver intégralement** (inventaire détaillé dans le code) :

- Saisie du CA en 4 modes : jours travaillés (calendrier, clic cyclique vide → plein → demi, glisser-peindre, remplir/vider mois ou année avec annulation), prestations au forfait datées, montant mensuel unique, mixte.
- TJM par défaut + TJM personnalisé par mois ; multi-activités (jusqu'à 4, une primaire) avec rattachement des revenus.
- Calculs : URSSAF, CFP, taxe consulaire, ACRE (50 % / 25 % selon la date de création, 12 mois), IJ, IR au barème ou VL, net mensuel et net cumulé, taux de rétention, CA réalisé vs projeté, projection des mois futurs au rythme nominal.
- Seuils : plafond micro (date de franchissement projetée), franchise TVA basique/majorée (date de bascule), alerte compte bancaire dédié (> 10 000 €).
- TVA : assujettissement à partir d'un mois, taux configurable, HT / TVA / TTC partout où une facture apparaît ; CA, net et seuils restent HT.
- Encaissements : projection facturé vs encaissé, à encaisser, reporté sur l'année suivante, calendrier des paiements, délais contractuels.
- Régularisation du versement libératoire : éligibilité RFR × parts, sélection des mois, IR au barème vs VL payé, somme à provisionner.
- Multi-années : sélecteur, transition « reprendre l'année précédente » ou « repartir de zéro », transition automatique au changement d'année.
- Notifications (VL inéligible, compte pro, seuil micro proche / dépassé) masquables et restaurables ; glossaire fiscal en infobulles ; onboarding par persona ; installation PWA ; thème clair / sombre / système ; gestion des mises à jour majeures ; pages d'erreur et 404.

**Contraintes techniques** :

- Stack existante : React 19, TanStack Start / Router (file routes), Vite, Tailwind CSS 4, Recharts, Motion, Lucide, Vitest. Pas de backend.
- **Compatibilité des données persistées obligatoire** : clés `fiscal-*` et versions de schéma (`YearConfig` v5, etc.) ; une refonte UI ne doit jamais faire perdre ou réinitialiser les données d'un utilisateur existant.
- Le moteur de calcul vit dans `src/lib` et est couvert par Vitest ; la refonte UI ne modifie pas les résultats de calcul sans décision explicite.
- Doit rester utilisable hors ligne après le premier chargement.

**Langue et ton** : interface en français, vouvoiement (l'éditeur de TJM mensuel tutoie aujourd'hui : incohérence à corriger). Les montants sont des estimations : l'app rappelle qu'elle ne remplace pas un conseil fiscal professionnel.

**Décisions ouvertes** : le nom « Fiscal Architect » peut changer (l'utilisateur l'autorise) mais tout renommage doit être proposé et confirmé explicitement, car il touche le dépôt, la PWA installée et les README.

## Brand Commitments

- **Style coloré, façon Monday** (choix explicite de l'utilisateur après rejet d'une version bleu et blanc) : couleurs vives, pastilles et blocs pleins, coins arrondis, typo ronde.
- **Chaque type de donnée garde sa couleur partout. La TVA (et tout montant TTC) a sa couleur à elle, réservée** : l'utilisateur s'en sert pour reconnaître d'un coup d'œil un prix TVA comprise.
- Les réglages qui changent le net (versement libératoire, TVA, ACRE, TJM du mois, charges fixes) restent modifiables directement depuis l'écran d'accueil.
- Le nom peut changer, mais tout renommage doit être confirmé explicitement.
- Principe « données 100 % locales, aucun envoi serveur » à préserver dans le discours.

## Evidence on Hand

- Captures README réalisées avec un jeu de démonstration entièrement fictif, **Studio Lumen** (`.github/screenshots/`). Toute nouvelle capture doit utiliser des données fictives, jamais de données réelles.
- Aucun témoignage, chiffre d'usage, client, presse ou benchmark n'existe : n'en inventer aucun.

## Product Principles

1. **Le net d'abord.** Chaque écran aide à répondre à « combien il me reste vraiment », avant le brut et avant les détails.
2. **Pointer en quelques secondes, au pouce.** La saisie quotidienne sur téléphone doit être immédiate ; l'analyse peut demander plus de profondeur.
3. **Voir venir.** Seuils, bascule TVA, sommes à provisionner et encaissements apparaissent avant de devenir un problème, avec leur date.
4. **Estimer honnêtement.** Toujours distinguer réalisé, projeté et estimé, HT et TTC ; une valeur n'a qu'un nom et qu'une place.
5. **Privé par construction.** Rien ne quitte l'appareil ; l'utilisateur garde la main sur ses sauvegardes.

## Accessibility & Inclusion

Pas de norme formelle confirmée. Engagements déjà présents à conserver et étendre : respect de `prefers-reduced-motion`, annonces lecteur d'écran (live region) pour les actions de masse, pièges de focus et fermeture Échap des dialogues, cibles tactiles de 44 px. Lacune connue à combler : le calendrier doit devenir utilisable au clavier et au toucher (glisser au doigt).
