import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, BACKEND_ENABLED } from '../config';
import { Payment } from '../data/types';

const TOKEN_KEY = 'awaazpay.device_token';
const SHOP_KEY = 'awaazpay.shop';

export interface ShopInfo {
  id: number;
  name: string;
  join_code: string;
  role: 'owner' | 'staff';
}

let cachedToken: string | null | undefined;

async function getToken(): Promise<string | null> {
  if (cachedToken !== undefined) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

interface ReqOpts {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

/**
 * Uses XMLHttpRequest (React Native's native networking) rather than the global
 * fetch — Expo SDK 57's fetch (expo/fetch) throws on some Android runtimes, so
 * XHR is the portable transport.
 */
async function req<T>(path: string, opts: ReqOpts = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = opts;
  const token = auth ? await getToken() : null;

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${API_BASE_URL}${path}`);
    xhr.timeout = 15000;
    xhr.setRequestHeader('Accept', 'application/json');
    if (body) xhr.setRequestHeader('Content-Type', 'application/json');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(xhr.responseText ? (JSON.parse(xhr.responseText) as T) : (null as T));
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error(`API ${method} ${path} → ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error(`API ${method} ${path} network error`));
    xhr.ontimeout = () => reject(new Error(`API ${method} ${path} timeout`));
    xhr.send(body ? JSON.stringify(body) : null);
  });
}

export interface TemplateResponse {
  updated: boolean;
  version?: number;
  payload?: unknown;
}

/**
 * Backend client. Every method is a safe no-op / throw-free wrapper the callers
 * can fire-and-forget — the app stays fully functional offline, so backend
 * failures never block local detection/announcement.
 */
export const backend = {
  enabled: BACKEND_ENABLED,

  async isRegistered(): Promise<boolean> {
    return !!(await getToken());
  },

  async getShop(): Promise<ShopInfo | null> {
    const s = await AsyncStorage.getItem(SHOP_KEY);
    return s ? (JSON.parse(s) as ShopInfo) : null;
  },

  async registerOwner(shopName: string, fcmToken: string | null): Promise<ShopInfo> {
    const r = await req<{ device_token: string; shop: Omit<ShopInfo, 'role'> }>('/register', {
      method: 'POST',
      auth: false,
      body: { role: 'owner', shop_name: shopName, fcm_token: fcmToken, platform: 'android' },
    });
    await AsyncStorage.setItem(TOKEN_KEY, r.device_token);
    cachedToken = r.device_token;
    const shop: ShopInfo = { ...r.shop, role: 'owner' };
    await AsyncStorage.setItem(SHOP_KEY, JSON.stringify(shop));
    return shop;
  },

  async joinAsStaff(code: string, name: string, fcmToken: string | null): Promise<ShopInfo> {
    const r = await req<{ device_token: string; shop: Omit<ShopInfo, 'role'> }>('/register', {
      method: 'POST',
      auth: false,
      body: { role: 'staff', name, invite_code: code, join_code: code, fcm_token: fcmToken, platform: 'android' },
    });
    await AsyncStorage.setItem(TOKEN_KEY, r.device_token);
    cachedToken = r.device_token;
    const shop: ShopInfo = { ...r.shop, role: 'staff' };
    await AsyncStorage.setItem(SHOP_KEY, JSON.stringify(shop));
    return shop;
  },

  async getTemplates(version: number): Promise<TemplateResponse> {
    return req<TemplateResponse>(`/templates?platform=android&version=${version}`, { auth: false });
  },

  async syncPayment(p: Payment): Promise<void> {
    await req('/payments', {
      method: 'POST',
      body: {
        source: p.source,
        payer: p.payer,
        amount: p.amount,
        txn_id: p.txnId ?? null,
        received_at: new Date(p.receivedAt).toISOString(),
      },
    });
  },

  async createInvite(): Promise<{ code: string; expires_at: string }> {
    return req('/staff/invites', { method: 'POST', body: {} });
  },

  async updateFcmToken(fcmToken: string): Promise<void> {
    await req('/heartbeat', { method: 'POST', body: { fcm_token: fcmToken } });
  },
};
