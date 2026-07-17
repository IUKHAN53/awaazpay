import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Speech from 'expo-speech';
import { PaymentListener } from '../../modules/payment-listener';
import {
  ListenerStatus,
  Payment,
  paymentKey,
  PaymentSource,
  Settings,
  SOURCE_META,
  StaffMember,
} from './types';
import { announcementEnglish, announcementUrdu } from './urduNumbers';
import { backend } from '../api/client';

const SETTINGS_KEY = 'awaazpay.settings.v1';
const PAYMENTS_KEY = 'awaazpay.payments.v1';
const STAFF_KEY = 'awaazpay.staff.v1';
const TEMPLATES_KEY = 'awaazpay.templatesJson';

const DEFAULT_SETTINGS: Settings = {
  language: 'ur',
  voiceGender: 'female',
  volume: 1,
  repeatCount: 2,
  sources: { easypaisa: true, jazzcash: true, bank: false },
  extraSenders: { easypaisa: [], jazzcash: [], bank: [] },
  onboarded: false,
};

interface AppState {
  ready: boolean;
  settings: Settings;
  payments: Payment[];
  staff: StaffMember[];
  status: ListenerStatus;
  /** Payment currently being announced (drives the full-screen moment) */
  announcing: Payment | null;
  /** Server-delivered parser templates JSON (null = use bundled defaults). */
  templatesJson: string | null;
  setTemplatesJson: (json: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  addPayment: (
    p: Omit<Payment, 'id' | 'receivedAt'>,
    opts?: { silent?: boolean; receivedAt?: number; showOverlay?: boolean; fromBackend?: boolean },
  ) => void;
  dismissAnnouncement: () => void;
  repeatAnnouncement: () => void;
  playTestAnnouncement: () => void;
  addStaff: (name: string, role: string) => void;
  removeStaff: (id: string) => void;
  setStatus: (s: ListenerStatus) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [status, setStatus] = useState<ListenerStatus>('listening');
  const [announcing, setAnnouncing] = useState<Payment | null>(null);
  const [templatesJson, setTemplatesJsonState] = useState<string | null>(null);
  // Keys of payments already recorded — dedupes the same payment arriving both
  // as a live event and via the drained native store.
  const seenKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const [s, p, st, tpl] = await Promise.all([
          AsyncStorage.getItem(SETTINGS_KEY),
          AsyncStorage.getItem(PAYMENTS_KEY),
          AsyncStorage.getItem(STAFF_KEY),
          AsyncStorage.getItem(TEMPLATES_KEY),
        ]);
        if (s) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(s) });
        if (p) {
          const loaded: Payment[] = JSON.parse(p);
          setPayments(loaded);
          loaded.forEach((pay) => seenKeys.current.add(paymentKey(pay)));
        }
        if (st) setStaff(JSON.parse(st));
        if (tpl) setTemplatesJsonState(tpl);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setTemplatesJson = useCallback((json: string) => {
    setTemplatesJsonState(json);
    AsyncStorage.setItem(TEMPLATES_KEY, json).catch(() => {});
  }, []);

  const persistSettings = useCallback((next: Settings) => {
    setSettings(next);
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      persistSettings({ ...settings, ...patch });
    },
    [settings, persistSettings],
  );

  const speak = useCallback(
    (payment: Payment, repeat: number) => {
      const text =
        settings.language === 'ur'
          ? announcementUrdu(payment.source, payment.amount)
          : announcementEnglish(SOURCE_META[payment.source].label, payment.amount);
      const lang = settings.language === 'ur' ? 'ur-PK' : 'en-US';
      Speech.stop();
      for (let i = 0; i < repeat; i++) {
        Speech.speak(text, { language: lang, volume: settings.volume });
      }
    },
    [settings.language, settings.volume],
  );

  const addPayment = useCallback(
    (
      p: Omit<Payment, 'id' | 'receivedAt'>,
      opts?: { silent?: boolean; receivedAt?: number; showOverlay?: boolean; fromBackend?: boolean },
    ) => {
      const payment: Payment = {
        ...p,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        receivedAt: opts?.receivedAt ?? Date.now(),
      };

      // Dedupe: the same payment can arrive both as a live event and via the
      // drained native store. Skip everything (record, overlay, sync) if seen.
      const key = paymentKey(payment);
      if (seenKeys.current.has(key)) return;
      seenKeys.current.add(key);

      setPayments((prev) => {
        const next = [payment, ...prev].sort((a, b) => b.receivedAt - a.receivedAt);
        AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(next.slice(0, 500))).catch(() => {});
        return next;
      });
      // Native listener announces on its own; JS speaks only for dev/simulated payments
      if (!opts?.silent) {
        setAnnouncing(payment);
        speak(payment, settings.repeatCount);
      } else if (opts?.showOverlay) {
        setAnnouncing(payment);
      }
      // Sync to backend (dashboard + fan-out to staff). Fire-and-forget; never
      // blocks local behaviour. Skipped for payments that arrived FROM the
      // backend to avoid a loop.
      if (backend.enabled && !opts?.fromBackend) {
        backend.syncPayment(payment).catch(() => {});
      }
    },
    [speak, settings.repeatCount],
  );

  const dismissAnnouncement = useCallback(() => setAnnouncing(null), []);

  const repeatAnnouncement = useCallback(() => {
    if (announcing) speak(announcing, 1);
  }, [announcing, speak]);

  const playTestAnnouncement = useCallback(() => {
    // Prefer the real native pipeline so the test exercises the full flow
    // (parse → announce → onPayment event → overlay → history), identical to
    // a live wallet notification. Uses the always-watched Easypaisa package.
    if (PaymentListener) {
      try {
        PaymentListener.simulateNotification(
          'pk.com.telenor.phoenix',
          'You have received Rs 1,500 from Bilal Ahmed',
        );
        return;
      } catch {}
    }
    // JS-only fallback (Expo Go / iOS): just speak.
    speak(
      { id: 'test', source: 'easypaisa', payer: 'Test', amount: 1500, receivedAt: Date.now() },
      1,
    );
  }, [speak]);

  const addStaff = useCallback((name: string, role: string) => {
    setStaff((prev) => {
      const next = [
        ...prev,
        { id: `${Date.now()}`, name, role, active: true },
      ];
      AsyncStorage.setItem(STAFF_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const removeStaff = useCallback((id: string) => {
    setStaff((prev) => {
      const next = prev.filter((m) => m.id !== id);
      AsyncStorage.setItem(STAFF_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      ready,
      settings,
      payments,
      staff,
      status,
      announcing,
      templatesJson,
      setTemplatesJson,
      updateSettings,
      addPayment,
      dismissAnnouncement,
      repeatAnnouncement,
      playTestAnnouncement,
      addStaff,
      removeStaff,
      setStatus,
    }),
    [
      ready,
      settings,
      payments,
      staff,
      status,
      announcing,
      templatesJson,
      setTemplatesJson,
      updateSettings,
      addPayment,
      dismissAnnouncement,
      repeatAnnouncement,
      playTestAnnouncement,
      addStaff,
      removeStaff,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

/** Helpers for grouping/summing payments */
export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function sumForDay(payments: Payment[], dayStart: number): number {
  const dayEnd = dayStart + 86_400_000;
  return payments
    .filter((p) => p.receivedAt >= dayStart && p.receivedAt < dayEnd)
    .reduce((acc, p) => acc + p.amount, 0);
}

export function paymentsForSource(payments: Payment[], source: PaymentSource | 'all'): Payment[] {
  return source === 'all' ? payments : payments.filter((p) => p.source === source);
}
