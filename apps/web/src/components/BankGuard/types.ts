/** Shapes returned by the /bank circuit-breaker API. */

export type TransferAction =
  | 'INSTANT_TRANSFER'
  | 'COOLING_OFF'
  | 'STEP_UP_REQUIRED'
  | 'GUARDIAN_HOLD';

export interface GuardianInfo {
  name: string;
  relationship: string;
  channel: string;
  notified: boolean;
}

export interface TransferValidateResponse {
  allowed: boolean;
  tier: 0 | 1 | 2 | 3;
  action: TransferAction;
  risk_score: number;
  hold_id?: string | null;
  held_amount?: number | null;
  cooling_off_seconds?: number | null;
  escrow_release_at?: string | null;
  reasons: string[];
  message_en: string;
  message_ur: string;
  guardian?: GuardianInfo | null;
}

export interface AccountStatus {
  account_id: string;
  account_number_masked: string;
  holder_name: string;
  balance: number;
  available_balance: number;
  currency: string;
  held_funds_total: number;
  active_holds: number;
  circuit_breaker_tier: 0 | 1 | 2 | 3;
  guardian: GuardianInfo;
}

export interface HoldActionResponse {
  hold_id: string;
  status: 'released_and_sent' | 'blocked_and_returned' | 'already_resolved';
  amount: number;
  balance_after: number;
  message_en: string;
  message_ur: string;
  resolved_at: string;
}

export interface Txn {
  id: string;
  name: string;
  detail: string;
  amount: number;
  credit: boolean;
  when: string;
}

export const TIER_META: Record<number, { label: string; tone: string; dot: string }> = {
  0: { label: 'Normal', tone: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  1: { label: 'Caution', tone: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  2: { label: 'Elevated', tone: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
  3: { label: 'Protected', tone: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
};

export const BANKS = [
  'Meezan Bank',
  'HBL',
  'UBL',
  'Bank Alfalah',
  'JazzCash',
  'Easypaisa',
  'NayaPay',
];

export const fmtPKR = (n: number) =>
  'Rs. ' + n.toLocaleString('en-PK', { maximumFractionDigits: 0 });
