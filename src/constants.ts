import { UserProfile } from '~/types';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex Durand',
  role: 'Freelance Senior UX',
  status: 'micro',
  tjm: 650,
  workingDays: 19,
  urssafRate: 25.8,
  incomeTaxBracket: '30% - Revenu médian (27k€ - 78k€)',
  fixedCosts: [
    { id: '1', name: 'Outils & SaaS', description: 'Adobe, Slack, Notion', amount: 85, icon: 'laptop', color: 'bg-blue-100 text-blue-600' },
    { id: '2', name: 'Espace coworking', description: 'Location bureau mensuel', amount: 350, icon: 'users', color: 'bg-emerald-100 text-emerald-600' },
    { id: '3', name: 'Assurance pro', description: 'RC Pro + Mutuelle', amount: 120, icon: 'shield', color: 'bg-slate-100 text-slate-600' },
  ],
  seuilMicro: 83_600,
  versementLiberatoire: false,
};

export const MONTHS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
];

export const CHART_DATA = [
  { name: 'Jan', gross: 10000, net: 6500 },
  { name: 'Fév', gross: 11500, net: 7200 },
  { name: 'Mar', gross: 10800, net: 6800 },
  { name: 'Avr', gross: 12000, net: 7800 },
  { name: 'Mai', gross: 11200, net: 7100 },
  { name: 'Jun', gross: 14300, net: 9410 },
  { name: 'Jul', gross: 12400, net: 7820 },
  { name: 'Aoû', gross: 13000, net: 8200 },
  { name: 'Sep', gross: 11800, net: 7400 },
  { name: 'Oct', gross: 12500, net: 7900 },
  { name: 'Nov', gross: 11000, net: 6900 },
  { name: 'Déc', gross: 12000, net: 7600 },
];
