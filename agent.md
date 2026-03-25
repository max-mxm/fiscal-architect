# Agent — Instructions pour le développement assisté

Ce fichier guide l'agent LLM lors des sessions de développement sur Fiscal Architect.

## Références

- **CLAUDE.md** : Stack technique, architecture, conventions de code, domaine métier
- **docs/** : Documentation vivante (tâches, objectifs, architecture, progression)

## Workflow obligatoire

1. **Avant de coder** : lire `docs/taches.md` pour identifier la tâche en cours
2. **Début de tâche** : marquer la tâche `[~]` en cours dans `docs/taches.md`
3. **Fin de tâche** : marquer `[x]` fait, mettre à jour `docs/progression.md`
4. **Problèmes rencontrés** : ajouter une entrée dans `docs/journal.md`
5. **Commit** : utiliser le format `TASK-ID: description` (ex: `FOUND-01: add useLocalStorage hook`)

## Ordre de priorité

```
M0 (Fondations) → M1/M2/M3/M4 (parallélisables) → M5 (Transversal)
```

M0 est un prérequis bloquant. Ne pas commencer M1-M4 sans avoir terminé M0.

## Règles strictes

- **Pas de hardcode** : toute donnée affichée doit provenir du state ou du moteur fiscal
- **Moteur fiscal** : toujours utiliser `src/lib/fiscal.ts` pour les calculs — jamais de calcul inline dans les composants
- **Types** : tout nouveau type dans `src/types.ts`, pas de `any`
- **Documentation** : toujours mettre à jour `docs/taches.md` et `docs/progression.md` après chaque tâche
- **Pas de backend** : tout est client-side, persistence via localStorage uniquement

## Contexte métier — Fiscalité française

### Micro-entreprise
- **Taux URSSAF** (prestations services BNC) : 22%
- **Seuil CA annuel** : 77 700 €
- **Imposition** : barème progressif IR après abattement 34%

### Barème IR 2024 (par part)
| Tranche | Taux |
|---------|------|
| 0 — 11 294 € | 0% |
| 11 295 — 28 797 € | 11% |
| 28 798 — 82 341 € | 30% |
| 82 342 — 177 106 € | 41% |
| > 177 106 € | 45% |

### SASU
- Salaire : charges patronales ~45%, charges salariales ~22%
- Dividendes : flat tax 30% (PFU) ou barème progressif
- IS : 15% jusqu'à 42 500 €, 25% au-delà

### EURL (IS)
- TNS : cotisations ~45% sur rémunération
- IS : même barème que SASU
- Dividendes : cotisations TNS sur la part > 10% du capital
