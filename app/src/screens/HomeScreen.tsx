import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, layout, radius } from '../theme/tokens';
import { useApp, startOfDay, sumForDay } from '../data/store';
import { formatRupees } from '../data/types';
import { LogoRow } from '../components/Logo';
import { ListeningPill } from '../components/ListeningPill';
import { PaymentRow } from '../components/PaymentRow';
import { PulseRings } from '../components/PulseRings';
import { Icon } from '../components/Icon';
import { toast } from '../components/Toast';

export function HomeScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { payments, playTestAnnouncement } = useApp();
  const insets = useSafeAreaInsets();

  const playTest = () => {
    playTestAnnouncement();
    toast.info('Playing test announcement', 'This is how a payment will sound');
  };

  const todayStart = startOfDay(Date.now());
  const todayTotal = sumForDay(payments, todayStart);
  const todayCount = payments.filter((p) => p.receivedAt >= todayStart).length;
  const recent = payments.slice(0, 8);
  const isEmpty = payments.length === 0;

  return (
    <View style={styles.root}>
      {/* Navy header with rounded bottom */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 20 }]}>
        <View style={styles.headerTop}>
          <LogoRow />
          <Pressable style={styles.gearBtn} onPress={onOpenSettings}>
            <Icon name="settings" size={22} color="#fff" />
          </Pressable>
        </View>
        <ListeningPill showUrdu={!isEmpty} />
        {!isEmpty && (
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Today's collection · آج</Text>
            <Text style={styles.totalAmount}>{formatRupees(todayTotal)}</Text>
            <Text style={styles.totalCount}>
              {todayCount} payment{todayCount === 1 ? '' : 's'} received
            </Text>
          </View>
        )}
      </View>

      {isEmpty ? (
        /* Empty state — waiting for first payment */
        <View style={styles.emptyWrap}>
          <PulseRings size={150} color="rgba(26,46,110,0.15)" duration={2600} borderWidth={2}>
            <View style={styles.earCircle}>
              <Icon name="listening" size={46} color={colors.navy} />
            </View>
          </PulseRings>
          <View style={styles.emptyTextBlock}>
            <Text style={styles.emptyTitle}>Waiting for your first payment</Text>
            <Text style={styles.emptyUrdu}>
              پہلی پیمنٹ کا انتظار ہے
            </Text>
            <Text style={styles.emptyHint}>
              The moment money arrives on Easypaisa, JazzCash or bank — you'll hear it. Keep
              the phone on.
            </Text>
          </View>
          <Pressable style={styles.testBtn} onPress={playTest}>
            <Icon name="speaker" size={20} color={colors.navy} />
            <Text style={styles.testLabel}>Play a test announcement</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <Text style={styles.sectionLabel}>Recent</Text>
          <View style={styles.list}>
            {recent.map((p) => (
              <PaymentRow key={p.id} payment={p} />
            ))}
          </View>
        </ScrollView>
      )}
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
    paddingHorizontal: layout.screenPad,
    paddingBottom: 24,
    gap: 18,
    borderBottomLeftRadius: radius.header,
    borderBottomRightRadius: radius.header,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gearBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.whiteOnNavy10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: {
    fontSize: 20,
  },
  totalBlock: {
    gap: 2,
    paddingBottom: 6,
  },
  totalLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.white60,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalAmount: {
    fontFamily: fonts.extrabold,
    fontSize: 52,
    lineHeight: 58,
    color: '#fff',
    letterSpacing: -1,
  },
  totalCount: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.gold,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: layout.screenPad,
    paddingTop: 18,
    gap: 10,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  list: {
    gap: 10,
  },
  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    paddingHorizontal: 32,
  },
  earCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earIcon: {
    fontSize: 42,
  },
  emptyTextBlock: {
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.ink,
    textAlign: 'center',
  },
  emptyUrdu: {
    fontFamily: fonts.urduSemibold,
    writingDirection: 'rtl',
    fontSize: 16,
    lineHeight: 32,
    color: colors.muted,
  },
  emptyHint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 21,
    color: colors.faint,
    textAlign: 'center',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  testIcon: {
    fontSize: 20,
  },
  testLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.navy,
  },
});
