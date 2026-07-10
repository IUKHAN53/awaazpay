import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, layout, radius } from '../theme/tokens';
import { Icon } from '../components/Icon';
import { diagnostics, nativePermissions } from '../native/useNativeListener';
import { SeenNotification } from '../../modules/payment-listener';

/**
 * Live diagnostics for the "not reading notifications" case. Shows whether the
 * listener is bound, whether access/battery are granted, and every notification
 * the service has seen (package + text) — so the real wallet package name and
 * wording can be identified and the parser locked to it.
 */
export function DiagnosticsScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [connected, setConnected] = useState(false);
  const [access, setAccess] = useState(false);
  const [battery, setBattery] = useState(false);
  const [seen, setSeen] = useState<SeenNotification[]>([]);

  const refresh = () => {
    setConnected(diagnostics.isListenerConnected());
    setAccess(nativePermissions.isNotificationAccessGranted());
    setBattery(diagnostics.isBatteryExempt());
    setSeen(diagnostics.seenNotifications());
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, []);

  const row = (label: string, ok: boolean, hint: string) => (
    <View style={styles.statusRow}>
      <Icon name={ok ? 'check' : 'close'} size={18} color={ok ? colors.easypaisa : colors.error} />
      <View style={{ flex: 1 }}>
        <Text style={styles.statusLabel}>{label}</Text>
        {!ok && <Text style={styles.statusHint}>{hint}</Text>}
      </View>
      <Text style={[styles.statusValue, { color: ok ? colors.easypaisa : colors.error }]}>
        {ok ? 'OK' : 'NO'}
      </Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 20 }]}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Diagnostics</Text>
        <Text style={styles.subtitle}>Why isn't it hearing payments?</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.card}>
          {row('Notification access granted', access, 'Tap "Fix it now" on the home screen')}
          {row('Listener connected', connected, 'Tap Reconnect, or reboot the phone')}
          {row('Battery unrestricted', battery, 'Optional — helps it survive in the background')}
        </View>

        {access && !connected && (
          <Pressable
            style={styles.reconnect}
            onPress={() => {
              diagnostics.requestRebind();
              setTimeout(refresh, 1500);
            }}
          >
            <Icon name="repeat" size={18} color="#fff" />
            <Text style={styles.reconnectLabel}>Reconnect listener</Text>
          </Pressable>
        )}

        <View style={styles.hintCard}>
          <Icon name="speaker" size={18} color={colors.navy} />
          <Text style={styles.hintText}>
            Send yourself a small payment. It should appear below. If it does but isn't
            announced, screenshot this and share it — we'll match the exact wording.
          </Text>
        </View>

        <View style={styles.seenHeader}>
          <Text style={styles.seenTitle}>Notifications seen ({seen.length})</Text>
          <Pressable onPress={() => { diagnostics.clear(); refresh(); }}>
            <Text style={styles.clearBtn}>Clear</Text>
          </Pressable>
        </View>

        {seen.length === 0 && (
          <Text style={styles.empty}>
            Nothing yet. If this stays empty even after a notification arrives, the listener
            isn't receiving — reboot or re-grant access.
          </Text>
        )}

        {seen.map((n, i) => (
          <View
            key={i}
            style={[
              styles.notif,
              n.matched ? styles.notifMatched : n.watched ? styles.notifWatched : null,
            ]}
          >
            <View style={styles.notifTop}>
              <Text style={styles.notifPkg} numberOfLines={1}>
                {n.pkg}
              </Text>
              {n.matched ? (
                <Text style={styles.tagMatched}>✓ payment</Text>
              ) : n.watched ? (
                <Text style={styles.tagWatched}>watched</Text>
              ) : null}
            </View>
            {!!n.title && <Text style={styles.notifTitle}>{n.title}</Text>}
            {!!n.text && (
              <Text style={styles.notifText} numberOfLines={4}>
                {n.text}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: layout.screenPad,
    paddingBottom: 18,
    gap: 6,
  },
  back: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white70 },
  title: { fontFamily: fonts.bold, fontSize: 22, color: '#fff' },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.white70 },
  body: { flex: 1 },
  bodyContent: { padding: layout.screenPad, paddingTop: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  statusLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  statusHint: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.faint, marginTop: 1 },
  statusValue: { fontFamily: fonts.bold, fontSize: 13 },
  reconnect: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    height: 48,
  },
  reconnectLabel: { fontFamily: fonts.bold, fontSize: 14, color: '#fff' },
  hintCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: colors.navyTint,
    borderRadius: radius.card,
    padding: 14,
  },
  hintText: { flex: 1, fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 18, color: colors.ink },
  seenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  seenTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  clearBtn: { fontFamily: fonts.semibold, fontSize: 13, color: colors.error },
  empty: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.faint },
  notif: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 3,
  },
  notifWatched: { borderColor: colors.gold, borderWidth: 1.5 },
  notifMatched: { borderColor: colors.easypaisa, borderWidth: 1.5, backgroundColor: colors.greenTint },
  notifTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  notifPkg: { flex: 1, fontFamily: fonts.medium, fontSize: 11, color: colors.faint },
  tagWatched: { fontFamily: fonts.bold, fontSize: 10, color: colors.goldDark },
  tagMatched: { fontFamily: fonts.bold, fontSize: 10, color: colors.easypaisa },
  notifTitle: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  notifText: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17, color: colors.muted },
});
