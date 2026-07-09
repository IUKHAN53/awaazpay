import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, layout, radius } from '../theme/tokens';
import { useApp } from '../data/store';
import { Icon } from '../components/Icon';
import { toast } from '../components/Toast';

export function StaffScreen({ onBack }: { onBack: () => void }) {
  const { staff, addStaff, removeStaff } = useApp();
  const insets = useSafeAreaInsets();

  const inviteByPhone = () => {
    const add = (name: string) => {
      addStaff(name, 'staff');
      toast.success('Staff invited', `${name}'s phone will announce payments too`);
    };
    // Placeholder until backend invites land — adds a demo member.
    if (Alert.prompt) {
      Alert.prompt('Invite by phone number', 'Enter staff member name', (name) => name && add(name));
    } else {
      add(`Staff ${staff.length + 1}`);
    }
  };

  const remove = (id: string, name: string) => {
    removeStaff(id);
    toast.info('Staff removed', `${name} will no longer be alerted`);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 20 }]}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Add your staff</Text>
        <Text style={styles.subtitle}>Their phones will announce payments too</Text>
        <Text style={styles.subtitleUrdu}>
          ان کے فون بھی اعلان کریں گے
        </Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* QR invite card */}
        <View style={styles.qrCard}>
          <View style={styles.qrBox}>
            <Text style={styles.qrPlaceholder}>QR code{'\n'}(shop invite)</Text>
          </View>
          <Text style={styles.qrHint}>Ask them to scan with their phone</Text>
        </View>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>

        <Pressable style={styles.phoneBtn} onPress={inviteByPhone}>
          <Icon name="invite" size={20} color="#fff" />
          <Text style={styles.phoneBtnLabel}>Invite by phone number</Text>
        </Pressable>

        {staff.map((m) => (
          <View key={m.id} style={styles.memberCard}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberInitial}>{m.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.memberText}>
              <Text style={styles.memberName}>
                {m.name}
                {m.role ? ` (${m.role})` : ''}
              </Text>
              <Text style={styles.memberStatus}>
                {m.active ? '● Active — announcing' : '○ Invited'}
              </Text>
            </View>
            <Pressable style={styles.removeBtn} onPress={() => remove(m.id, m.name)}>
              <Text style={styles.removeLabel}>Remove</Text>
            </Pressable>
          </View>
        ))}
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
    paddingBottom: 22,
    gap: 6,
  },
  back: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.white70,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#fff',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.white70,
  },
  subtitleUrdu: {
    fontFamily: fonts.urduSemibold,
    writingDirection: 'rtl',
    fontSize: 14,
    lineHeight: 28,
    color: colors.white75,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: layout.screenPad,
    paddingTop: 24,
    gap: 18,
    alignItems: 'center',
  },
  qrCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 22,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrBox: {
    width: 180,
    height: 180,
    borderRadius: radius.card,
    backgroundColor: '#f2f0e8',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#c9c6b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholder: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.faint,
    textAlign: 'center',
  },
  qrHint: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'center',
  },
  orRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderInput,
  },
  orText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.faint,
  },
  phoneBtn: {
    width: '100%',
    height: 58,
    borderRadius: radius.lg,
    backgroundColor: colors.navy,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneBtnLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#fff',
  },
  memberCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: {
    fontFamily: fonts.extrabold,
    fontSize: 15,
    color: colors.navy,
  },
  memberText: {
    flex: 1,
  },
  memberName: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.ink,
  },
  memberStatus: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.easypaisa,
  },
  removeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.errorBg,
  },
  removeLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.error,
  },
});
