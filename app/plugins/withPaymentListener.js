/**
 * Expo config plugin for the AwaazPay payment listener.
 *
 * Adds to AndroidManifest.xml:
 *  - the NotificationListenerService (primary payment detector)
 *  - foreground-service + notification permissions
 *  - battery-optimization exemption request permission
 *
 * The SMS receiver is only added in the `full` (sideload) flavor — gated by
 * the AWAAZPAY_FLAVOR env var so the Play Store build never carries SMS perms.
 */
const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

const LISTENER_SERVICE = 'pk.awaazpay.app.listener.PaymentNotificationListener';
const SMS_RECEIVER = 'pk.awaazpay.app.listener.PaymentSmsReceiver';
const FULL_FLAVOR = process.env.AWAAZPAY_FLAVOR === 'full';

function ensurePermission(manifest, name) {
  manifest.manifest['uses-permission'] = manifest.manifest['uses-permission'] || [];
  const exists = manifest.manifest['uses-permission'].some(
    (p) => p.$['android:name'] === name,
  );
  if (!exists) {
    manifest.manifest['uses-permission'].push({ $: { 'android:name': name } });
  }
}

module.exports = function withPaymentListener(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

    ensurePermission(manifest, 'android.permission.POST_NOTIFICATIONS');
    ensurePermission(manifest, 'android.permission.FOREGROUND_SERVICE');
    ensurePermission(manifest, 'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK');
    ensurePermission(manifest, 'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS');
    if (FULL_FLAVOR) {
      ensurePermission(manifest, 'android.permission.RECEIVE_SMS');
    }

    // NotificationListenerService — the primary payment detector.
    app.service = app.service || [];
    const hasListener = app.service.some(
      (s) => s.$['android:name'] === LISTENER_SERVICE,
    );
    if (!hasListener) {
      app.service.push({
        $: {
          'android:name': LISTENER_SERVICE,
          'android:exported': 'false',
          'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.service.notification.NotificationListenerService' } },
            ],
          },
        ],
      });
    }

    // SMS receiver — full/sideload flavor only. Never present in the store build.
    if (FULL_FLAVOR) {
      app.receiver = app.receiver || [];
      const hasReceiver = app.receiver.some((r) => r.$['android:name'] === SMS_RECEIVER);
      if (!hasReceiver) {
        app.receiver.push({
          $: {
            'android:name': SMS_RECEIVER,
            'android:exported': 'true',
            'android:permission': 'android.permission.BROADCAST_SMS',
          },
          'intent-filter': [
            {
              $: { 'android:priority': '999' },
              action: [
                { $: { 'android:name': 'android.provider.Telephony.SMS_RECEIVED' } },
              ],
            },
          ],
        });
      }
    }

    return config;
  });
};
