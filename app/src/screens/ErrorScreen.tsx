import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, layout, radius } from '../theme/tokens';
import { useApp } from '../data/store';
import { BigButton } from '../components/BigButton';
import { Icon } from '../components/Icon';
import { nativePermissions } from '../native/useNativeListener';

/**
 * "Not listening" screen — shown when notification access is revoked or
 * battery saver is restricting us. Red header, one-tap fixes opening the
 * matching Android settings screens (falls back to clearing the status
 * when the native module is unavailable, keeping the flow demoable).
 */
export function ErrorScreen() {
  const { status, setStatus } = useApp();
  const insets = useSafeAreaInsets();

  const notifOff = status === 'notification-access-off';

  const fixPrimary = () => {
    if (!nativePermissions.available) return setStatus('listening');
    if (notifOff) nativePermissions.openNotificationAccessSettings();
    else nativePermissions.requestBatteryExemption();
  };

  const fixBattery = () => {
    if (!nativePermissions.available) return setStatus('listening');
    nativePermissions.requestBatteryExemption();
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 20 }]}>
        <View style={styles.statusPill}>
          <Icon name="mute" size={16} color="#fff" />
          <Text style={styles.statusLabel}>Not listening</Text>
          <Text style={styles.statusUrdu}>
            نہیں سن رہا
          </Text>
        </View>
        <Text style={styles.headline}>Payments will be missed</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Primary issue card */}
        <View style={[styles.issueCard, styles.issuePrimary]}>
          <View style={styles.issueRow}>
            <View style={[styles.issueIconBox, { backgroundColor: colors.errorBg }]}>
              <Icon name={notifOff ? 'bell' : 'battery'} size={26} color={colors.error} />
            </View>
            <View style={styles.issueText}>
              <Text style={styles.issueTitle}>
                {notifOff ? 'Notification access is off' : 'Background running blocked'}
              </Text>
              <Text style={styles.issueHint}>
                {notifOff
                  ? 'Turned off after a phone update'
                  : 'Battery saver stopped the listener'}
              </Text>
            </View>
          </View>
          <BigButton
            label="Fix it now ▸"
            variant="danger"
            height={56}
            onPress={fixPrimary}
          />
        </View>

        {/* Secondary issue card */}
        <View style={[styles.issueCard, styles.issueSecondary]}>
          <View style={[styles.issueIconBox, { backgroundColor: colors.goldTint }]}>
            <Icon name="battery" size={26} color={colors.goldDark} />
          </View>
          <View style={styles.issueText}>
            <Text style={styles.issueTitle}>Battery saver is limiting us</Text>
            <Text style={styles.issueHint}>Allow background running</Text>
          </View>
          <Pressable style={styles.allowBtn} onPress={fixBattery}>
            <Text style={styles.allowLabel}>Allow</Text>
          </Pressable>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerHint}>Once fixed, you'll hear:</Text>
          <View style={styles.footerVoiceRow}>
            <Icon name="speaker" size={16} color={colors.easypaisa} />
            <Text style={styles.footerVoice}>"AwaazPay is listening again"</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.error,
    paddingHorizontal: layout.screenPad,
    paddingBottom: 24,
    gap: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  statusIcon: {
    fontSize: 16,
  },
  statusLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#fff',
  },
  statusUrdu: {
    fontFamily: fonts.urduSemibold,
    writingDirection: 'rtl',
    fontSize: 12,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.85)',
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 31,
    color: '#fff',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: layout.screenPad,
    paddingTop: 22,
    gap: 14,
    flexGrow: 1,
  },
  issueCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 18,
  },
  issuePrimary: {
    borderWidth: 2,
    borderColor: colors.error,
    gap: 14,
  },
  issueSecondary: {
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    opacity: 0.85,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  issueIconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  issueIcon: {
    fontSize: 26,
  },
  issueText: {
    flex: 1,
    gap: 2,
  },
  issueTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  issueHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
  },
  allowBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.navyTint,
  },
  allowLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.navy,
  },
  footerNote: {
    marginTop: 'auto',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 10,
  },
  footerHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.faint,
  },
  footerVoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerVoice: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.easypaisa,
  },
});
