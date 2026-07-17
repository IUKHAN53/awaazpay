import { useEffect } from 'react';
import { AppState } from 'react-native';
import { PaymentListener } from '../../modules/payment-listener';
import { useApp } from '../data/store';
import { ListenerStatus, Payment, PaymentSource } from '../data/types';

function toSource(s: string): PaymentSource {
  return s === 'easypaisa' || s === 'jazzcash' || s === 'bank' ? s : 'bank';
}

/**
 * Glue between the native listener and the JS store:
 *  - drains payments captured while JS was dead
 *  - subscribes to live onPayment events
 *  - pushes settings changes down to the native config
 *  - keeps the listening/error status in sync with real permission state
 *
 * No-ops entirely when the native module is unavailable (Expo Go / iOS).
 */
export function useNativeListener() {
  const { settings, addPayment, setStatus, ready, templatesJson } = useApp();

  // Drain the native store (every detected payment is persisted there) on mount
  // AND whenever the app returns to the foreground — this is what makes payments
  // that arrived in the background show up in History/Reports. Dedupe in
  // addPayment prevents doubles with the live event.
  useEffect(() => {
    const listener = PaymentListener;
    if (!listener || !ready) return;

    const drain = () => {
      try {
        for (const p of listener.drainPendingPayments()) {
          addPayment(
            { source: toSource(p.source), payer: p.payer, amount: p.amount, txnId: p.txnId || undefined },
            { silent: true, receivedAt: p.receivedAt },
          );
        }
      } catch {}
    };

    drain();

    const sub = listener.addListener('onPayment', (p) => {
      // Live event — record + show the moment (not re-spoken; native announced).
      addPayment(
        { source: toSource(p.source), payer: p.payer, amount: p.amount, txnId: p.txnId || undefined },
        { silent: true, receivedAt: p.receivedAt, showOverlay: true },
      );
    });
    const appStateSub = AppState.addEventListener('change', (s) => {
      if (s === 'active') drain();
    });
    return () => {
      sub.remove();
      appStateSub.remove();
    };
  }, [ready, addPayment]);

  // Push settings to native config
  useEffect(() => {
    if (!PaymentListener || !ready) return;
    const sources = (Object.keys(settings.sources) as PaymentSource[]).filter(
      (s) => settings.sources[s],
    );
    try {
      PaymentListener.setConfig(
        settings.language,
        settings.repeatCount,
        settings.volume,
        sources,
        templatesJson, // server-delivered rules, or null → bundled defaults
        settings.extraSenders,
      );
    } catch {}
  }, [
    ready,
    settings.language,
    settings.repeatCount,
    settings.volume,
    settings.sources,
    settings.extraSenders,
    templatesJson,
  ]);

  // Reflect real permission state in the UI status.
  // Only NOTIFICATION ACCESS gates listening — the service reads notifications
  // without a battery exemption (that only affects background reliability, so a
  // missing exemption must NOT flip the app to a red "Not listening" state).
  // Re-checks on foreground so granting access in Settings reflects instantly
  // (no more "red until you restart the app").
  useEffect(() => {
    const listener = PaymentListener;
    if (!listener || !ready || !settings.onboarded) return;
    const check = () => {
      let status: ListenerStatus = 'listening';
      try {
        if (!listener.isNotificationAccessGranted()) {
          status = 'notification-access-off';
        } else {
          // Keep the process alive (reliability) and ensure the listener is bound.
          listener.startKeepAlive();
          if (!listener.isListenerConnected()) {
            listener.requestListenerRebind();
          }
        }
      } catch {}
      setStatus(status);
    };
    check();
    const id = setInterval(check, 15_000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [ready, settings.onboarded, setStatus]);
}

/** Permission helpers used by onboarding + error screens. */
export const nativePermissions = {
  available: !!PaymentListener,
  isNotificationAccessGranted: () => {
    try {
      return PaymentListener?.isNotificationAccessGranted() ?? false;
    } catch {
      return false;
    }
  },
  openNotificationAccessSettings: () => {
    try {
      PaymentListener?.openNotificationAccessSettings();
    } catch {}
  },
  isBatteryExempt: () => {
    try {
      return PaymentListener?.isBatteryExempt() ?? false;
    } catch {
      return false;
    }
  },
  requestBatteryExemption: () => {
    try {
      PaymentListener?.requestBatteryExemption();
    } catch {}
  },
};

/** Diagnostics: is the listener bound + what has it seen. */
export const diagnostics = {
  available: !!PaymentListener,
  isListenerConnected: (): boolean => {
    try {
      return PaymentListener?.isListenerConnected() ?? false;
    } catch {
      return false;
    }
  },
  isBatteryExempt: (): boolean => {
    try {
      return PaymentListener?.isBatteryExempt() ?? false;
    } catch {
      return false;
    }
  },
  seenNotifications: () => {
    try {
      return PaymentListener?.getSeenNotifications() ?? [];
    } catch {
      return [];
    }
  },
  requestRebind: () => {
    try {
      PaymentListener?.requestListenerRebind();
    } catch {}
  },
  clear: () => {
    try {
      PaymentListener?.clearSeenNotifications();
    } catch {}
  },
};

/** Basic sender validation used when the native module is absent (dev/iOS). */
function jsIsAdmissibleSender(sender: string): boolean {
  const s = sender.trim();
  if (!s) return false;
  // Reject personal numbers: 03xxxxxxxxx / 92xxxxxxxxxx / +92... / any 8+ digit run
  if (/\d{8,}/.test(s.replace(/[\s-]/g, ''))) return false;
  if (/^\+?92?3\d{8,9}$/.test(s.replace(/[\s-]/g, ''))) return false;
  const digitsOnly = /^\d+$/.test(s);
  if (digitsOnly) return s.length >= 3 && s.length <= 6; // short code
  return true; // alphanumeric sender ID
}

/** Trusted-sender helpers for the security settings screen. */
export const senderPolicy = {
  /** Validate before adding — blocks personal numbers. */
  isAdmissible: (sender: string): boolean => {
    try {
      return PaymentListener?.isAdmissibleSender(sender) ?? jsIsAdmissibleSender(sender);
    } catch {
      return jsIsAdmissibleSender(sender);
    }
  },
  /** Built-in official senders per source (read-only). */
  official: (): Record<string, string[]> => {
    try {
      return (
        PaymentListener?.officialSenders() ?? {
          easypaisa: ['Easypaisa', '3737'],
          jazzcash: ['JazzCash', '8558'],
          bank: ['Meezan Bank', 'HBL'],
        }
      );
    } catch {
      return { easypaisa: ['Easypaisa', '3737'], jazzcash: ['JazzCash', '8558'], bank: [] };
    }
  },
};

export type { Payment };
