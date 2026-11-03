import type { Transaction, Bill, Goal, Account, Category } from '@/lib/db/schema';
import type { calculateFinancialOverview } from '@/lib/finance/calculator';

export type InsightPeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type InsightResultState = 'INSIGHT_AVAILABLE' | 'INSUFFICIENT_DATA' | 'NO_SIGNIFICANT_FINDING';

export type InsightUrgency = 'CRITICAL' | 'WARNING' | 'OPPORTUNITY' | 'HYGIENE' | 'NEUTRAL';

export type InsightActionTarget = 'transactions' | 'bills' | 'goals';

export interface InsightEvidence {
  currentValue: string;
  previousValue?: string;
  diff?: string;
}

export interface FinancialInsight {
  id: string;
  periodType: InsightPeriodType;
  urgency: InsightUrgency;
  title: string;
  observation: string;
  evidence: InsightEvidence;
  interpretation: string;
  recommendation: string;
  actionTarget?: InsightActionTarget;
  actionLabel?: string;
  nominalImpact?: number;
}

export interface PeriodInsightResult {
  periodType: InsightPeriodType;
  state: InsightResultState;
  insight?: FinancialInsight;
  fallbackMessage?: string;
}

export interface InsightEngineInput {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  bills: Bill[];
  goals: Goal[];
  overview?: Awaited<ReturnType<typeof calculateFinancialOverview>>;
  referenceDate?: Date; // Opsional untuk deterministik testing
}
