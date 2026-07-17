import { requireOptionalNativeModule, NativeModule } from 'expo-modules-core';

export interface NativePaymentEvent {
  source: string;
  amount: number;
  payer: string;
  txnId: string;
  receivedAt: number;
}

export interface SeenNotification {
  pkg: string;
  title: string;
  text: string;
  ts: number;
  watched: boolean;
  matched: boolean;
}

type PaymentListenerEvents = {
  onPayment(event: NativePaymentEvent): void;
};

declare class PaymentListenerModuleType extends NativeModule<PaymentListenerEvents> {
  isNotificationAccessGranted(): boolean;
  openNotificationAccessSettings(): void;
  isBatteryExempt(): boolean;
  requestBatteryExemption(): void;
  isUrduTtsAvailable(): boolean;
  setConfig(
    language: string,
    repeat: number,
    volume: number,
    sources: string[],
    templates: string | null,
    extraSenders: Record<string, string[]>,
  ): void;
  drainPendingPayments(): NativePaymentEvent[];
  announceTest(language: string, volume: number): void;
  /** Feed text through the real notification pipeline; returns true if parsed. */
  simulateNotification(pkg: string, text: string): boolean;
  /** Whether Android has bound + connected our NotificationListenerService. */
  isListenerConnected(): boolean;
  /** Force Android to (re)bind the listener after a fresh access grant. */
  requestListenerRebind(): void;
  /** Start the keep-alive foreground service (reliability in the background). */
  startKeepAlive(): void;
  /** Recent notifications the listener saw (diagnostics). */
  getSeenNotifications(): SeenNotification[];
  clearSeenNotifications(): void;
  /** False for personal mobile numbers / empty — UI blocks the add. */
  isAdmissibleSender(sender: string): boolean;
  /** Built-in official trusted senders per source (read-only). */
  officialSenders(): Record<string, string[]>;
}

/**
 * Null in Expo Go / on iOS / before prebuild — every call site must handle
 * the null case (the JS-only dev experience keeps working without the
 * native layer).
 */
export const PaymentListener =
  requireOptionalNativeModule<PaymentListenerModuleType>('PaymentListener');
