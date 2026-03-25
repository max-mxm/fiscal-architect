export interface UserProfile {
  name: string;
  role: string;
  status: 'micro' | 'sasu' | 'eurl';
  tjm: number;
  workingDays: number;
  urssafRate: number;
  incomeTaxBracket: string;
  fixedCosts: { id: string; name: string; description: string; amount: number; icon: string; color: string }[];
  seuilMicro: number;
  versementLiberatoire: boolean;
}

// --- Types enrichis (FOUND-03) ---

export interface CalendarMonth {
  month: number; // 0-11
  year: number;
  workedDays: number[]; // indices des jours travaillés (1-31)
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

export interface MonthlyChartData {
  month: string;
  brut: number;
  net: number;
}
