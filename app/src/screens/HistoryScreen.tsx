import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, layout, radius } from '../theme/tokens';
import { useApp, startOfDay } from '../data/store';
import { formatRupees, Payment, PaymentSource, SOURCE_META } from '../data/types';
import { PaymentRow } from '../components/PaymentRow';

type Filter = 'all' | PaymentSource;

function dayLabel(dayStart: number): string {
  const today = startOfDay(Date.now());
  if (dayStart === today) return 'TODAY';
  if (dayStart === today - 86_400_000) return 'YESTERDAY';
  return new Date(dayStart)
    .toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })
    .toUpperCase();
}

export function HistoryScreen() {
  const { payments } = useApp();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');

  const groups = useMemo(() => {
    const filtered =
      filter === 'all' ? payments : payments.filter((p) => p.source === filter);
    const byDay = new Map<number, Payment[]>();
    for (const p of filtered) {
      const day = startOfDay(p.receivedAt);
      const arr = byDay.get(day) ?? [];
      arr.push(p);
      byDay.set(day, arr);
    }
    return [...byDay.entries()].sort((a, b) => b[0] - a[0]);
  }, [payments, filter]);

  const chip = (key: Filter, label: string, badge?: PaymentSource) => {
    const active = filter === key;
    return (
      <Pressable
        key={key}
        style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
        onPress={() => setFilter(key)}
      >
        {badge && (
          <View style={[styles.chipBadge, { backgroundColor: SOURCE_META[badge].color }]}>
            <Text style={styles.chipBadgeText}>{SOURCE_META[badge].short}</Text>
          </View>
        )}
        <Text style={[styles.chipLabel, active ? styles.chipLabelActive : styles.chipLabelIdle]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 20 }]}>
        <Text style={styles.title}>
          History <Text style={styles.titleUrdu}>· تاریخچہ</Text>
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {chip('all', 'All')}
          {chip('easypaisa', 'Easypaisa', 'easypaisa')}
          {chip('jazzcash', 'JazzCash', 'jazzcash')}
          {chip('bank', '🏦')}
        </ScrollView>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {groups.length === 0 && (
          <Text style={styles.noneYet}>No payments yet</Text>
        )}
        {groups.map(([day, items]) => {
          const total = items.reduce((acc, p) => acc + p.amount, 0);
          return (
            <View key={day} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupLabel}>{dayLabel(day)}</Text>
                <Text style={styles.groupTotal}>{formatRupees(total)}</Text>
              </View>
              {items.map((p) => (
                <PaymentRow key={p.id} payment={p} timeMode="clock" />
              ))}
            </View>
          );
        })}
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
    backgroundColor: colors.navy,
    paddingHorizontal: layout.screenPad,
    paddingBottom: 18,
    gap: 14,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#fff',
  },
  titleUrdu: {
    fontFamily: fonts.urduSemibold,
    writingDirection: 'rtl',
    fontSize: 15,
    color: colors.white70,
  },
  chips: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
  },
  chipActive: {
    backgroundColor: colors.gold,
  },
  chipIdle: {
    backgroundColor: colors.whiteOnNavy12,
  },
  chipBadge: {
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 7,
    color: '#fff',
  },
  chipLabel: {
    fontSize: 12.5,
  },
  chipLabelActive: {
    fontFamily: fonts.bold,
    color: colors.navy,
  },
  chipLabelIdle: {
    fontFamily: fonts.semibold,
    color: '#fff',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: layout.screenPad,
    paddingTop: 16,
    gap: 8,
  },
  noneYet: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.faint,
    textAlign: 'center',
    marginTop: 32,
  },
  group: {
    gap: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  groupLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.muted,
  },
  groupTotal: {
    fontFamily: fonts.extrabold,
    fontSize: 15,
    color: colors.navy,
  },
});
