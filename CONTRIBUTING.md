# Contribuer à Fiscal Architect

Merci de votre intérêt ! Les corrections de constantes fiscales, l'ajout de tests, et les améliorations d'accessibilité sont particulièrement bienvenus.

## Setup

```bash
git clone https://github.com/max-mxm/fiscal-architect.git
cd fiscal-architect
npm install
npm run dev          # http://localhost:4000
```

Node 22 requis (voir `.nvmrc`).

## Workflow

1. Forkez le repo et créez une branche depuis `main`.
2. Faites vos changements. Toute modification fiscale doit passer par `src/lib/fiscal.ts` — pas de calcul inline dans les composants.
3. Vérifiez :
   ```bash
   npm run lint
   npm test
   npm run build
   ```
4. Ouvrez une PR. La CI doit passer au vert.

## Conventions

- **TypeScript strict** — pas de `any`, types dans `src/types.ts`.
- **Tailwind utility-first** — pas de CSS modules.
- **Pas de hardcode** — toute donnée affichée vient du state ou du moteur fiscal.
- **Tests** — pour tout changement de calcul fiscal, ajoutez ou mettez à jour un test dans `src/lib/__tests__/`.

## Constantes fiscales

Les valeurs proviennent uniquement de sources officielles : URSSAF, BOFiP, Service-Public.fr, Journal Officiel.
Toute mise à jour doit citer la source dans le message de commit ou la description de PR.

## Signaler un bug ou une incohérence fiscale

Utilisez les [templates d'issues](https://github.com/max-mxm/fiscal-architect/issues/new/choose). Pour les incohérences fiscales, le template dédié vous demandera la source officielle — c'est essentiel.

## Licence

En contribuant, vous acceptez que votre code soit publié sous licence [MIT](./LICENSE).
