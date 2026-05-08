export type FiscalTerm = {
  title: string;
  body: string;
  example?: string;
};

const ENTRIES = {
  acre: {
    title: 'ACRE',
    body: "Aide aux Créateurs et Repreneurs d'Entreprise. Réduction de moitié des cotisations URSSAF pendant les 12 premiers mois suivant la création de l'entreprise.",
    example: "Demandée auprès de l'URSSAF lors de la création — un gain de trésorerie significatif la 1ʳᵉ année.",
  },
  rfr: {
    title: 'RFR — Revenu fiscal de référence',
    body: "Total des revenus de votre foyer fiscal sur une année donnée. Indiqué sur l'avis d'imposition (cadre « Vos références » en haut). Sert ici à vérifier votre éligibilité au Versement Libératoire.",
  },
  nMinus2: {
    title: 'N-2',
    body: "Avant-dernière année fiscale. C'est le RFR de cette année-là qui détermine si vous pouvez choisir le Versement Libératoire pour l'année courante.",
    example: "En 2026, N-2 = 2024 → on regarde le RFR figurant sur l'avis d'imposition reçu en 2025 (revenus 2024).",
  },
  parts: {
    title: 'Parts fiscales',
    body: "Unités de calcul de votre foyer pour l'impôt. 1 part = célibataire, 2 = couple marié/pacsé, +0,5 par enfant (1 part entière dès le 3ᵉ). Le plafond RFR pour le VL est multiplié par ce nombre.",
    example: 'Couple marié + 2 enfants = 3 parts → plafond multiplié par 3.',
  },
  vl: {
    title: 'Versement libératoire (VL)',
    body: "Paiement forfaitaire de l'impôt sur le revenu prélevé en même temps que les cotisations URSSAF (1 % à 2,2 % du CA selon l'activité). Remplace l'impôt au barème progressif. Réservé aux foyers dont le RFR N-2 est sous le plafond.",
  },
  bicBnc: {
    title: 'BIC / BNC',
    body: "BIC = Bénéfices Industriels et Commerciaux (vente de biens, services artisanaux/commerciaux). BNC = Bénéfices Non Commerciaux (professions libérales : conseil, formation, développement…). Détermine le taux d'abattement et les cotisations URSSAF applicables.",
  },
  ssi: {
    title: 'SSI — Sécurité Sociale des Indépendants',
    body: "Caisse d'affiliation par défaut des libéraux non réglementés (consultants, formateurs, coachs, développeurs…). Gère la retraite et l'assurance maladie.",
  },
  cipav: {
    title: 'CIPAV',
    body: "Caisse Interprofessionnelle de Prévoyance et d'Assurance Vieillesse. Caisse de retraite réservée à certaines professions libérales réglementées (architectes, ostéopathes, psychologues, géomètres-experts…).",
  },
  tjm: {
    title: 'TJM — Taux Journalier Moyen',
    body: 'Montant facturé par jour travaillé, hors taxes. Multiplié par le nombre de jours pour obtenir le CA mensuel.',
    example: '600 € × 18 jours = 10 800 € de CA sur le mois.',
  },
  ij: {
    title: 'IJ — Indemnités journalières',
    body: "Revenus versés par l'Assurance Maladie en cas d'arrêt de travail. Pour y avoir droit, les libéraux SSI/CIPAV cotisent un petit pourcentage du CA en plus de l'URSSAF standard.",
  },
  franchiseEnBase: {
    title: 'Franchise en base de TVA',
    body: "Régime simplifié : vous ne facturez pas la TVA à vos clients et ne la déclarez pas. C'est le régime par défaut sous les seuils de franchise.\n\nMention obligatoire sur la facture : « TVA non applicable, art. 293 B du CGI ».",
  },
} satisfies Record<string, FiscalTerm>;

export type FiscalTermId = keyof typeof ENTRIES;
export const FISCAL_GLOSSARY: Record<FiscalTermId, FiscalTerm> = ENTRIES;
