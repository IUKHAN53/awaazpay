import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme/tokens';
import { formatRupees, Payment } from '../data/types';
import { SourceBadge } from './SourceBadge';

function timeAgo(ts: number): string {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return new Date(ts).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
}

function clockTime(ts: number): string {
  return new Date(ts)
    .toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();
}

/** White payment card row: source avatar, payer + time, amount. */
export function PaymentRow({
  payment,
  timeMode = 'ago',
}: {
  payment: Payment;
  timeMode?: 'ago' | 'clock';
}) {
  return (
    <View style={styles.card}>
      <SourceBadge source={payment.source} size={timeMode === 'ago' ? 40 : 38} />
      <View style={styles.middle}>
        <Text style={styles.payer} numberOfLines={1}>
          {payment.payer}
        </Text>
        <Text style={styles.time}>
          {timeMode === 'ago' ? timeAgo(payment.receivedAt) : clockTime(payment.receivedAt)}
        </Text>
      </View>
      <Text style={styles.amount}>{formatRupees(payment.amount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  middle: {
    flex: 1,
  },
  payer: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.ink,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.faint,
  },
  amount: {
    fontFamily: fonts.extrabold,
    fontSize: 19,
    color: colors.ink,
  },
});
