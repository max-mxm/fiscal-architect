import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface UserProfile {
  name: string;
  role: string;
  status: 'micro' | 'sasu' | 'eurl';
  tjm: number;
  workingDays: number;
  urssafRate: number;
  incomeTaxBracket: string;
  fixedCosts: { id: string; name: string; description: string; amount: number; icon: string; color: string }[];
}

export type Page = 'dashboard' | 'comparison' | 'calendar' | 'profile';
