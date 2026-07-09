import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, layout, radius } from '../theme/tokens';
import { useApp } from '../data/store';
import { VoiceLanguage } from '../data/types';
import { LogoRow } from '../components/Logo';
import { BigButton } from '../components/BigButton';
import { Icon } from '../components/Icon';
import { nativePermissions } from '../native/useNativeListener';

/**
 * 3-step onboarding: notification access, battery exemption, voice language.
 * Steps 1–2 open the real Android settings screens via the native module;
 * without it (Expo Go / iOS) they mark done on tap so the flow stays demoable.
 */
export function OnboardingScreen() {
  const { settings, updateSettings } = useApp();
  const insets = useSafeAreaInsets();
  const [notifDone, setNotifDone] = useState(nativePermissions.isNotificationAccessGranted());
  const [batteryDone, setBatteryDone] = useState(nativePermissions.isBatteryExempt());

  // Re-check when returning from the Android settings screens
  useEffect(() => {
    if (!nativePermissions.available) return;
    const id = setInterval(() => {
      setNotifDone(nativePermissions.isNotificationAccessGranted());
      setBatteryDone(nativePermissions.isBatteryExempt());
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const requestNotifications = () => {
    if (nativePermissions.available) nativePermissions.openNotificationAccessSettings();
    else setNotifDone(true);
  };

  const requestBattery = () => {
    if (nativePermissions.available) nativePermissions.requestBatteryExemption();
    else setBatteryDone(true);
  };

  const pickLanguage = (language: VoiceLanguage) => updateSettings({ language });

  const finish = () => updateSettings({ onboarded: true });

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 20 }]}>
        <LogoRow tileSize={40} textSize={18} />
        <Text style={styles.headline}>3 steps, then it speaks for you</Text>
        <Text style={styles.headlineUrdu}>
          تین قدم — پھر یہ آپ کے لیے بولے گا
        </Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Step 1: notifications */}
        <Pressable
          style={[styles.step, notifDone ? styles.stepDone : styles.stepIdle]}
          onPress={requestNotifications}
        >
          <View style={[styles.stepIconBox, { backgroundColor: colors.gold }]}>
            <Icon name="bell" size={26} color={colors.navy} />
          </View>
          <View style={styles.stepText}>
            <Text style={styles.stepTitle}>Allow notifications</Text>
            <Text style={styles.stepHint}>So we hear every payment</Text>
          </View>
          <Icon
            name={notifDone ? 'check' : 'chevron-right'}
            size={notifDone ? 20 : 24}
            color={notifDone ? colors.easypaisa : colors.disabled}
          />
        </Pressable>

        {/* Step 2: battery */}
        <Pressable
          style={[styles.step, batteryDone ? styles.stepDone : styles.stepIdle]}
          onPress={requestBattery}
        >
          <View style={[styles.stepIconBox, { backgroundColor: colors.navyTint }]}>
            <Icon name="battery" size={26} color={colors.navy} />
          </View>
          <View style={styles.stepText}>
            <Text style={styles.stepTitle}>Keep running</Text>
            <Text style={styles.stepHint}>Never sleeps, never misses</Text>
          </View>
          <Icon
            name={batteryDone ? 'check' : 'chevron-right'}
            size={batteryDone ? 20 : 24}
            color={batteryDone ? colors.easypaisa : colors.disabled}
          />
        </Pressable>

        {/* Step 3: voice */}
        <View style={[styles.step, styles.stepIdle, styles.stepColumn]}>
          <View style={styles.stepRow}>
            <View style={[styles.stepIconBox, { backgroundColor: colors.greenTint }]}>
              <Icon name="voice" size={26} color={colors.easypaisa} />
            </View>
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>Pick your voice</Text>
              <Text style={styles.stepHint}>Language of announcements</Text>
            </View>
          </View>
          <View style={styles.langRow}>
            <Pressable
              style={[
                styles.langBtn,
                settings.language === 'ur' ? styles.langActive : styles.langIdle,
              ]}
              onPress={() => pickLanguage('ur')}
            >
              <Text
                style={[
                  styles.langUrdu,
                  { color: settings.language === 'ur' ? '#fff' : colors.ink },
                ]}
              >
                اردو
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.langBtn,
                settings.language === 'en' ? styles.langActive : styles.langIdle,
              ]}
              onPress={() => pickLanguage('en')}
            >
              <Text
                style={[
                  styles.langLabel,
                  { color: settings.language === 'en' ? '#fff' : colors.ink },
                ]}
              >
                English
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 16 }]}>
        <BigButton label="Start listening ▸" onPress={finish} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 10,
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: '#fff',
  },
  headlineUrdu: {
    fontFamily: fonts.urduSemibold,
    writingDirection: 'rtl',
    fontSize: 15,
    lineHeight: 30,
    color: colors.white80,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: layout.screenPad,
    paddingTop: 22,
    gap: 14,
  },
  step: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 2,
  },
  stepColumn: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepDone: {
    borderColor: colors.navy,
  },
  stepIdle: {
    borderColor: colors.borderStrong,
  },
  stepIconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: {
    fontSize: 26,
  },
  stepText: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  stepHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
  },
  check: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.easypaisa,
  },
  chevron: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.disabled,
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langActive: {
    backgroundColor: colors.navy,
  },
  langIdle: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.borderInput,
  },
  langUrdu: {
    fontFamily: fonts.urduBold,
    writingDirection: 'rtl',
    fontSize: 16,
    lineHeight: 30,
  },
  langLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  footer: {
    paddingHorizontal: layout.screenPad,
  },
});
