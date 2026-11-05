import type { Transaction, Bill, Goal, Account, Category } from '@/lib/db/schema';
import type { calculateFinancialOverview } from '@/lib/finance/calculator';

export type InsightPeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type InsightResultState = 'INSIGHT_AVAILABLE' | 'INSUFFICIENT_DATA' | 'NO_SIGNIFICANT_FINDING';

export type InsightUrgency = 'CRITICAL' | 'WARNING' | 'OPPORTUNITY' | 'HYGIENE' | 'NEUTRAL';

export type InsightActionTarget = 'transactions' | 'bills' | 'goals';

/**
 * Domain masalah yang menjadi identitas item di Priority Inbox.
 * Severity tetap menjadi badge, sedangkan periode menjadi metadata kecil.
 */
export type InsightDomain = 'SALDO' | 'TAGIHAN' | 'PENGELUARAN' | 'TARGET' | 'DATA';

export interface InsightEvidenceItem {
  label: string;
  value: string;
}

export interface InsightEvidence {
  currentValue: string;
  previousValue?: string;
  diff?: string;
  /** Rincian terstruktur untuk evidence yang memiliki lebih dari dua komponen. */
  breakdown?: InsightEvidenceItem[];
}

export interface FinancialInsight {
  id: string;
  periodType: InsightPeriodType;
  domain: InsightDomain;
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
  /** Kandidat dengan prioritas tertinggi untuk kompatibilitas tampilan lama. */
  insight?: FinancialInsight;
  /** Seluruh kandidat periode, sudah diurutkan dari yang paling mendesak. */
  insights?: FinancialInsight[];
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
