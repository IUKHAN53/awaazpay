import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, layout, radius } from '../theme/tokens';
import { useApp } from '../data/store';
import { PaymentSource, SOURCE_META } from '../data/types';
import { senderPolicy } from '../native/useNativeListener';
import { Icon } from '../components/Icon';
import { toast } from '../components/Toast';

/**
 * Security screen: which senders AwaazPay will trust for SMS payments.
 *
 * Official wallet/bank sender IDs are built-in and read-only. The shopkeeper
 * can add their own bank's sender ID / short code, but personal mobile numbers
 * are rejected — this is what stops a scammer texting a fake "Rs 5000 received"
 * from a normal number and being announced.
 */
export function TrustedSendersScreen({ onBack }: { onBack: () => void }) {
  const { settings, updateSettings } = useApp();
  const insets = useSafeAreaInsets();
  const official = useMemo(() => senderPolicy.official(), []);

  const [draft, setDraft] = useState<Record<PaymentSource, string>>({
    easypaisa: '',
    jazzcash: '',
    bank: '',
  });

  const addSender = (source: PaymentSource) => {
    const value = draft[source].trim();
    if (!value) return;
    if (!senderPolicy.isAdmissible(value)) {
      toast.error(
        'Blocked — looks like a personal number',
        `Only official sender IDs or short codes (e.g. "Meezan Bank", "8079") can be trusted.`,
      );
      return;
    }
    const existing = settings.extraSenders[source] ?? [];
    const officialLower = (official[source] ?? []).map((s) => s.toLowerCase());
    if (
      existing.some((s) => s.toLowerCase() === value.toLowerCase()) ||
      officialLower.includes(value.toLowerCase())
    ) {
      toast.info('Already trusted', `"${value}" is already on the list.`);
      return;
    }
    updateSettings({
      extraSenders: { ...settings.extraSenders, [source]: [...existing, value] },
    });
    setDraft({ ...draft, [source]: '' });
    toast.success('Trusted sender added', `Payments from "${value}" will be announced.`);
  };

  const removeSender = (source: PaymentSource, value: string) => {
    updateSettings({
      extraSenders: {
        ...settings.extraSenders,
        [source]: (settings.extraSenders[source] ?? []).filter((s) => s !== value),
      },
    });
    toast.info('Sender removed', `"${value}" is no longer trusted.`);
  };

  const sourceBlock = (source: PaymentSource, label: string) => {
    const meta = SOURCE_META[source];
    const officialList = official[source] ?? [];
    const custom = settings.extraSenders[source] ?? [];
    return (
      <View key={source} style={styles.card}>
        <View style={styles.cardHead}>
          <View style={[styles.badge, { backgroundColor: meta.color }]}>
            <Text style={[styles.badgeText, source === 'bank' && { fontSize: 13 }]}>
              {meta.short}
            </Text>
          </View>
          <Text style={styles.cardTitle}>{label}</Text>
        </View>

        {officialList.map((s) => (
          <View key={s} style={styles.senderRow}>
            <Text style={styles.senderId}>{s}</Text>
            <View style={styles.lockPill}>
              <Icon name="lock" size={12} color={colors.easypaisa} />
              <Text style={styles.lockText}>Official</Text>
            </View>
          </View>
        ))}

        {custom.map((s) => (
          <View key={s} style={styles.senderRow}>
            <Text style={styles.senderId}>{s}</Text>
            <Pressable style={styles.removeBtn} onPress={() => removeSender(source, s)}>
              <Text style={styles.removeLabel}>Remove</Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="Add sender ID or short code"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            value={draft[source]}
            onChangeText={(t) => setDraft({ ...draft, [source]: t })}
            onSubmitEditing={() => addSender(source)}
          />
          <Pressable style={styles.addBtn} onPress={() => addSender(source)}>
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 20 }]}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Trusted senders</Text>
        <Text style={styles.subtitle}>
          AwaazPay only announces SMS payments from these. Personal numbers are never
          trusted — this blocks fake "payment received" scams.
        </Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.shield}>
          <Icon name="shield" size={24} color={colors.easypaisa} />
          <Text style={styles.shieldText}>
            A message from any normal mobile number is ignored, even if it says money was
            received.
          </Text>
        </View>

        {sourceBlock('easypaisa', 'Easypaisa')}
        {sourceBlock('jazzcash', 'JazzCash')}
        {sourceBlock('bank', 'Bank')}
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
    gap: 8,
  },
  back: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white70 },
  title: { fontFamily: fonts.bold, fontSize: 22, color: '#fff' },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.white70,
  },
  body: { flex: 1 },
  bodyContent: { padding: layout.screenPad, paddingTop: 16, gap: 12, paddingBottom: 32 },
  shield: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: colors.greenTint,
    borderRadius: radius.card,
    padding: 14,
  },
  shieldIcon: { fontSize: 22 },
  shieldText: { flex: 1, fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 18, color: colors.ink },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fonts.bold, fontSize: 10, color: '#fff' },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  senderId: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.greenTint,
  },
  lockText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.easypaisa },
  removeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.errorBg,
  },
  removeLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.error },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  input: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.borderInput,
    paddingHorizontal: 12,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
  addBtn: {
    width: 64,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { fontFamily: fonts.bold, fontSize: 14, color: '#fff' },
  error: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.error,
    backgroundColor: colors.errorBg,
    borderRadius: radius.card,
    padding: 12,
  },
});
