export type PaymentSource = 'easypaisa' | 'jazzcash' | 'bank';

export interface Payment {
  id: string;
  source: PaymentSource;
  /** Payer display name, e.g. "Bilal Ahmed" or "Meezan transfer" */
  payer: string;
  /** Amount in whole rupees */
  amount: number;
  /** Epoch millis */
  receivedAt: number;
  /** Transaction id from the message (stable dedupe key), if any. */
  txnId?: string;
}

/** Stable key to dedupe the same payment arriving via live event + drained store. */
export function paymentKey(p: {
  source: string;
  amount: number;
  receivedAt: number;
  txnId?: string;
}): string {
  return p.txnId ? `txn:${p.txnId}` : `k:${p.source}:${p.amount}:${p.receivedAt}`;
}

export type VoiceLanguage = 'ur' | 'en';
export type VoiceGender = 'female' | 'male';

export interface Settings {
  language: VoiceLanguage;
  voiceGender: VoiceGender;
  /** 0..1 */
  volume: number;
  repeatCount: 1 | 2 | 3;
  sources: Record<PaymentSource, boolean>;
  /** User-added trusted SMS senders per source (official ones are built-in). */
  extraSenders: Record<PaymentSource, string[]>;
  onboarded: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

export type ListenerStatus = 'listening' | 'notification-access-off' | 'battery-restricted';

export const SOURCE_META: Record<
  PaymentSource,
  { label: string; short: string; color: string }
> = {
  easypaisa: { label: 'Easypaisa', short: 'EP', color: '#1e7f4f' },
  jazzcash: { label: 'JazzCash', short: 'JC', color: '#c0392b' },
  bank: { label: 'Bank', short: '🏦', color: '#2f5fb3' },
};

export function formatRupees(amount: number): string {
  return `₨ ${amount.toLocaleString('en-PK')}`;
}
