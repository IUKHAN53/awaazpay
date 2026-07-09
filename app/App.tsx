import React, { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import {
  NotoNastaliqUrdu_400Regular,
  NotoNastaliqUrdu_600SemiBold,
  NotoNastaliqUrdu_700Bold,
} from '@expo-google-fonts/noto-nastaliq-urdu';
import { AppProvider, useApp } from './src/data/store';
import { colors } from './src/theme/tokens';
import { Tab, TabBar } from './src/components/TabBar';
import { HomeScreen } from './src/screens/HomeScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StaffScreen } from './src/screens/StaffScreen';
import { TrustedSendersScreen } from './src/screens/TrustedSendersScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ErrorScreen } from './src/screens/ErrorScreen';
import { IncomingPaymentOverlay } from './src/screens/IncomingPaymentOverlay';
import { PaymentSource } from './src/data/types';
import { useNativeListener } from './src/native/useNativeListener';
import { useBackendSync } from './src/api/useBackendSync';
import ToastRoot from 'react-native-toast-message';
import { toastConfig } from './src/components/Toast';

type View_ = 'main' | 'settings' | 'staff' | 'trustedSenders';

/** DEV ONLY — simulates an incoming payment until the native listener lands. */
function DevSimulateButton() {
  const { addPayment } = useApp();
  if (!__DEV__) return null;
  const simulate = () => {
    const sources: PaymentSource[] = ['easypaisa', 'jazzcash', 'bank'];
    const payers = ['Bilal Ahmed', 'Sana Tariq', 'Raheel Khan', 'Adnan Qureshi', 'Meezan transfer'];
    const amounts = [400, 850, 1200, 2000, 3500, 500, 1500];
    addPayment({
      source: sources[Math.floor(Math.random() * sources.length)],
      payer: payers[Math.floor(Math.random() * payers.length)],
      amount: amounts[Math.floor(Math.random() * amounts.length)],
    });
  };
  return (
    <Pressable style={styles.devFab} onPress={simulate}>
      <Text style={styles.devFabText}>₨+</Text>
    </Pressable>
  );
}

function Root() {
  const { ready, settings, status } = useApp();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('home');
  const [view, setView] = useState<View_>('main');
  useNativeListener();
  useBackendSync();

  // Android hardware back: navigate within the app instead of exiting.
  useEffect(() => {
    const onBack = () => {
      if (view === 'trustedSenders' || view === 'staff') {
        setView('settings');
        return true;
      }
      if (view === 'settings') {
        setView('main');
        return true;
      }
      if (tab !== 'home') {
        setTab('home');
        return true;
      }
      return false; // on Home → let the system exit the app
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [view, tab]);

  if (!ready) return <View style={styles.splash} />;

  if (!settings.onboarded) {
    return (
      <>
        <StatusBar style="light" />
        <OnboardingScreen />
      </>
    );
  }

  if (status !== 'listening') {
    return (
      <>
        <StatusBar style="light" />
        <ErrorScreen />
        <DevSimulateButton />
      </>
    );
  }

  if (view === 'settings') {
    return (
      <>
        <StatusBar style="light" />
        <SettingsScreen
          onBack={() => setView('main')}
          onOpenStaff={() => setView('staff')}
          onOpenTrustedSenders={() => setView('trustedSenders')}
        />
      </>
    );
  }

  if (view === 'staff') {
    return (
      <>
        <StatusBar style="light" />
        <StaffScreen onBack={() => setView('settings')} />
      </>
    );
  }

  if (view === 'trustedSenders') {
    return (
      <>
        <StatusBar style="light" />
        <TrustedSendersScreen onBack={() => setView('settings')} />
      </>
    );
  }

  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        {tab === 'home' && <HomeScreen onOpenSettings={() => setView('settings')} />}
        {tab === 'history' && <HistoryScreen />}
        {tab === 'reports' && <ReportsScreen />}
      </View>
      <TabBar active={tab} onChange={setTab} bottomInset={insets.bottom} />
      <IncomingPaymentOverlay />
      <DevSimulateButton />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    NotoNastaliqUrdu_400Regular,
    NotoNastaliqUrdu_600SemiBold,
    NotoNastaliqUrdu_700Bold,
  });

  if (!fontsLoaded) return <View style={styles.splash} />;

  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root />
      </AppProvider>
      <ToastRoot config={toastConfig} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screen: {
    flex: 1,
  },
  splash: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  devFab: {
    position: 'absolute',
    right: 16,
    bottom: 90,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  devFabText: {
    fontWeight: '800',
    fontSize: 16,
    color: colors.navy,
  },
});
