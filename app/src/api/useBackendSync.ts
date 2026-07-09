import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../data/store';
import { backend } from './client';
import { toast } from '../components/Toast';

const TPL_VERSION_KEY = 'awaazpay.tpl_version';

/**
 * Connects the app to the deployed backend (best-effort, non-blocking):
 *  1. Registers this phone as a shop owner on first onboarded launch.
 *  2. Pulls the active parser template and, if newer, applies it to the native
 *     listener (via store.templatesJson → useNativeListener setConfig).
 *
 * All failures are swallowed — the app works fully offline regardless. Staff
 * push (receiving fan-out) is a separate step that needs a Firebase project.
 */
export function useBackendSync() {
  const { ready, settings, setTemplatesJson } = useApp();

  useEffect(() => {
    if (!backend.enabled || !ready || !settings.onboarded) return;

    let cancelled = false;
    (async () => {
      // 1. Register as owner once.
      try {
        if (!(await backend.isRegistered())) {
          const shop = await backend.registerOwner('My Shop', null);
          toast.success('Cloud connected', `Shop code ${shop.join_code}`);
        }
      } catch {
        // Offline is fine — the app works fully without the backend. Stay quiet.
      }

      // 2. Template sync.
      try {
        const have = Number((await AsyncStorage.getItem(TPL_VERSION_KEY)) || '0');
        const res = await backend.getTemplates(have);
        if (!cancelled && res?.updated && res.payload) {
          setTemplatesJson(JSON.stringify(res.payload));
          await AsyncStorage.setItem(TPL_VERSION_KEY, String(res.version ?? have));
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, settings.onboarded, setTemplatesJson]);
}
