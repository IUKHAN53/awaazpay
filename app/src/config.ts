/**
 * App configuration. The backend (optional cloud services — staff alerts,
 * server-updatable parser templates, official webhooks) is deployed at:
 */
export const API_BASE_URL = 'https://awaazpay.iukhan.tech/api';

/**
 * When false, the app runs fully offline (local detection + announce + history)
 * and never calls the backend. Flip to true once the RN API client + a Firebase
 * project (google-services.json + FCM_SERVER_KEY) are in place to enable
 * staff/multi-device alerts and template sync.
 */
export const BACKEND_ENABLED = false;
