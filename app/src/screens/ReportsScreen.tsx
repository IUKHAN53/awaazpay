import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, layout, radius } from '../theme/tokens';
import { useApp, startOfDay, sumForDay } from '../data/store';
import { formatRupees, PaymentSource, SOURCE_META } from '../data/types';

type Range = 'today' | 'week' | 'month';

const DAY = 86_400_000;

export function ReportsScreen() {
  const { payments } = useApp();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<Range>('today');

  const todayStart = startOfDay(Date.now());
  const rangeStart =
    range === 'today' ? todayStart : range === 'week' ? todayStart - 6 * DAY : todayStart - 29 * DAY;

  const inRange = useMemo(
    () => payments.filter((p) => p.receivedAt >= rangeStart),
    [payments, rangeStart],
  );
  const total = inRange.reduce((acc, p) => acc + p.amount, 0);

  const prevStart = rangeStart - (todayStart + DAY - rangeStart);
  const prevTotal = payments
    .filter((p) => p.receivedAt >= prevStart && p.receivedAt < rangeStart)
    .reduce((acc, p) => acc + p.amount, 0);
  const deltaPct = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;

  const bySource = (source: PaymentSource) => {
    const items = inRange.filter((p) => p.source === source);
    return { total: items.reduce((a, p) => a + p.amount, 0), count: items.length };
  };

  // Last 7 days for the week chart (Mon..Sun style ordering by actual day)
  const week = useMemo(() => {
    const days: { label: string; total: number; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = todayStart - i * DAY;
      days.push({
        label: new Date(dayStart).toLocaleDateString('en-PK', { weekday: 'short' }),
        total: sumForDay(payments, dayStart),
        isToday: i === 0,
      });
    }
    return days;
  }, [payments, todayStart]);
  const weekMax = Math.max(1, ...week.map((d) => d.total));

  const rangeChip = (key: Range, label: string) => {
    const active = range === key;
    return (
      <Pressable
        key={key}
        style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
        onPress={() => setRange(key)}
      >
        <Text style={[styles.chipLabel, active ? styles.chipLabelActive : styles.chipLabelIdle]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  const sourceTile = (source: PaymentSource) => {
    const meta = SOURCE_META[source];
    const s = bySource(source);
    return (
      <View key={source} style={styles.tile}>
        <View style={[styles.tileBadge, { backgroundColor: meta.color }]}>
          <Text style={styles.tileBadgeText}>{meta.short}</Text>
        </View>
        <Text style={styles.tileAmount}>{formatRupees(s.total)}</Text>
        <Text style={styles.tileCount}>
          {s.count} payment{s.count === 1 ? '' : 's'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 20 }]}>
        <Text style={styles.title}>
          Reports <Text style={styles.titleUrdu}>· رپورٹ</Text>
        </Text>
        <View style={styles.chips}>
          {rangeChip('today', 'Today')}
          {rangeChip('week', 'Week')}
          {rangeChip('month', 'Month')}
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>
            Total {range === 'today' ? 'today' : `this ${range}`}
          </Text>
          <Text style={styles.totalAmount}>{formatRupees(total)}</Text>
          {deltaPct !== null && (
            <Text style={[styles.delta, { color: deltaPct >= 0 ? colors.easypaisa : colors.error }]}>
              {deltaPct >= 0 ? '▲' : '▼'} {Math.abs(deltaPct)}% vs previous
            </Text>
          )}
        </View>

        <View style={styles.tiles}>
          {sourceTile('easypaisa')}
          {sourceTile('jazzcash')}
          {sourceTile('bank')}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartLabel}>This week</Text>
          <View style={styles.chart}>
            {week.map((d, i) => (
              <View key={i} style={styles.chartCol}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: `${Math.max(4, Math.round((d.total / weekMax) * 100))}%`,
                      backgroundColor: d.isToday
                        ? colors.gold
                        : d.total === 0
                          ? colors.chartBarDim
                          : colors.chartBar,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.chartDay,
                    d.isToday ? styles.chartDayActive : undefined,
                  ]}
                >
                  {d.label}
                </Text>
              </View>
            ))}
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
    gap: 8,
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  chipActive: {
    backgroundColor: colors.gold,
  },
  chipIdle: {
    backgroundColor: colors.whiteOnNavy12,
  },
  chipLabel: {
    fontSize: 13,
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
    paddingTop: 18,
    gap: 14,
  },
  totalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 18,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.faint,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalAmount: {
    fontFamily: fonts.extrabold,
    fontSize: 44,
    lineHeight: 50,
    color: colors.ink,
    letterSpacing: -1,
  },
  delta: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  tiles: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: '#fff',
  },
  tileAmount: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: colors.ink,
    marginTop: 6,
  },
  tileCount: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: colors.faint,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.faint,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    height: 110,
  },
  chartCol: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },
  chartBar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  chartDay: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    color: colors.faint,
  },
  chartDayActive: {
    fontFamily: fonts.bold,
    color: colors.ink,
  },
});
