export interface UserProfile {
  name: string;
  role: string;
  status: 'micro' | 'sasu' | 'eurl';
  tjm: number;
  workingDays: number;
  urssafRate: number;
  fixedCosts: { id: string; name: string; description: string; amount: number; icon: string; color: string }[];
  seuilMicro: number;
  versementLiberatoire: boolean;
}

// --- Types enrichis (FOUND-03) ---

export interface CalendarMonth {
  month: number; // 0-11
  year: number;
  workedDays: number[]; // jours pleins (1-31)
  halfDays?: number[]; // demi-journées (1-31), optionnel pour rétro-compat localStorage
}

export interface FiscalYear {
  year: number;
  months: CalendarMonth[];
}

export interface Scenario {
  label: string;
  status: UserProfile['status'];
  tjm: number;
  workingDays: number;
  urssafRate: number;
  fixedCosts: number;
}

export interface FiscalResult {
  caAnnuel: number;
  chargesURSSAF: number;
  chargesFixes: number;
  revenuImposable: number;
  ir: number;
  netApresIR: number;
}

export interface MonthlyBreakdown {
  ca: number;
  urssaf: number;
  ir: number;
  chargesFixes: number;
  net: number;
  tauxNet: number;
}

export interface MonthlyChartData {
  month: string;
  brut: number;
  net: number;
}
