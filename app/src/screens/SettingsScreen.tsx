import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { colors, fonts, layout, radius } from '../theme/tokens';
import { useApp } from '../data/store';
import { PaymentSource, SOURCE_META } from '../data/types';
import { Icon, IconName } from '../components/Icon';
import { toast } from '../components/Toast';

export function SettingsScreen({
  onBack,
  onOpenStaff,
  onOpenTrustedSenders,
}: {
  onBack: () => void;
  onOpenStaff: () => void;
  onOpenTrustedSenders: () => void;
}) {
  const { settings, updateSettings, playTestAnnouncement } = useApp();
  const insets = useSafeAreaInsets();

  const playTest = () => {
    playTestAnnouncement();
    toast.info('Playing test announcement', 'This is how a payment will sound');
  };

  const toggleSource = (source: PaymentSource) => {
    updateSettings({
      sources: { ...settings.sources, [source]: !settings.sources[source] },
    });
  };

  const CardTitle = ({ icon, children }: { icon: IconName; children: string }) => (
    <View style={styles.cardTitleRow}>
      <Icon name={icon} size={18} color={colors.navy} />
      <Text style={styles.cardTitle}>{children}</Text>
    </View>
  );

  const sourceRow = (source: PaymentSource, label: string) => {
    const meta = SOURCE_META[source];
    const on = settings.sources[source];
    return (
      <View key={source} style={styles.sourceRow}>
        <View style={[styles.sourceBadge, { backgroundColor: meta.color }]}>
          {source === 'bank' ? (
            <Icon name="bank" size={17} color="#fff" />
          ) : (
            <Text style={styles.sourceBadgeText}>{meta.short}</Text>
          )}
        </View>
        <Text style={styles.sourceLabel}>{label}</Text>
        <Pressable
          style={[styles.toggle, { backgroundColor: on ? colors.easypaisa : colors.borderInput }]}
          onPress={() => toggleSource(source)}
        >
          <View style={[styles.knob, on ? styles.knobOn : styles.knobOff]} />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 20 }]}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>
          Settings <Text style={styles.titleUrdu}>· ترتیبات</Text>
        </Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Voice language + gender */}
        <View style={styles.card}>
          <CardTitle icon="voice">Voice language</CardTitle>
          <View style={styles.segment}>
            <Pressable
              style={[styles.segBtn, settings.language === 'ur' ? styles.segActive : styles.segIdle]}
              onPress={() => updateSettings({ language: 'ur' })}
            >
              <Text
                style={[
                  styles.segUrdu,
                  { color: settings.language === 'ur' ? '#fff' : colors.ink },
                ]}
              >
                اردو
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segBtn, settings.language === 'en' ? styles.segActive : styles.segIdle]}
              onPress={() => updateSettings({ language: 'en' })}
            >
              <Text
                style={[
                  styles.segLabel,
                  { color: settings.language === 'en' ? '#fff' : colors.ink },
                ]}
              >
                English
              </Text>
            </Pressable>
          </View>
          <View style={styles.segment}>
            <Pressable
              style={[
                styles.segBtnSmall,
                settings.voiceGender === 'female' ? styles.segGold : styles.segIdle,
              ]}
              onPress={() => updateSettings({ voiceGender: 'female' })}
            >
              <Icon
                name="female"
                size={18}
                color={settings.voiceGender === 'female' ? colors.navy : colors.ink}
              />
              <Text
                style={[
                  styles.segLabelSmall,
                  { color: settings.voiceGender === 'female' ? colors.navy : colors.ink },
                ]}
              >
                Female
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segBtnSmall,
                settings.voiceGender === 'male' ? styles.segGold : styles.segIdle,
              ]}
              onPress={() => updateSettings({ voiceGender: 'male' })}
            >
              <Icon
                name="male"
                size={18}
                color={settings.voiceGender === 'male' ? colors.navy : colors.ink}
              />
              <Text
                style={[
                  styles.segLabelSmall,
                  { color: settings.voiceGender === 'male' ? colors.navy : colors.ink },
                ]}
              >
                Male
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Volume + repeat */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <CardTitle icon="speaker">Volume</CardTitle>
            <Text style={styles.volumeValue}>
              {settings.volume >= 0.95 ? 'Max' : `${Math.round(settings.volume * 100)}%`}
            </Text>
          </View>
          <Slider
            minimumValue={0.2}
            maximumValue={1}
            value={settings.volume}
            onSlidingComplete={(v: number) => updateSettings({ volume: v })}
            minimumTrackTintColor={colors.gold}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.navy}
          />
          <View style={styles.rowBetween}>
            <CardTitle icon="repeat">Repeat each announcement</CardTitle>
            <View style={styles.repeatGroup}>
              {([1, 2, 3] as const).map((n) => {
                const active = settings.repeatCount === n;
                return (
                  <Pressable
                    key={n}
                    style={[styles.repeatBtn, active ? styles.repeatActive : styles.repeatIdle]}
                    onPress={() => updateSettings({ repeatCount: n })}
                  >
                    <Text
                      style={[styles.repeatText, { color: active ? '#fff' : colors.ink }]}
                    >
                      {n}×
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Sources */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Announce payments from</Text>
          {sourceRow('easypaisa', 'Easypaisa')}
          {sourceRow('jazzcash', 'JazzCash')}
          {sourceRow('bank', 'Bank SMS')}
        </View>

        {/* Staff + test */}
        <Pressable style={styles.linkCard} onPress={onOpenTrustedSenders}>
          <Icon name="shield" size={22} color={colors.goldDark} />
          <Text style={styles.linkLabel}>Trusted senders — block payment scams</Text>
          <Icon name="chevron-right" size={22} color={colors.disabled} />
        </Pressable>
        <Pressable style={styles.linkCard} onPress={onOpenStaff}>
          <Icon name="staff" size={22} color={colors.navy} />
          <Text style={styles.linkLabel}>Staff — their phones announce too</Text>
          <Icon name="chevron-right" size={22} color={colors.disabled} />
        </Pressable>
        <Pressable style={styles.linkCard} onPress={playTest}>
          <Icon name="speaker" size={22} color={colors.navy} />
          <Text style={styles.linkLabel}>Play a test announcement</Text>
          <Icon name="chevron-right" size={22} color={colors.disabled} />
        </Pressable>
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
    gap: 8,
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
  titleUrdu: {
    fontFamily: fonts.urduSemibold,
    writingDirection: 'rtl',
    fontSize: 15,
    color: colors.white70,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: layout.screenPad,
    paddingTop: 18,
    gap: 12,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  segment: {
    flexDirection: 'row',
    gap: 10,
  },
  segBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segBtnSmall: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segActive: {
    backgroundColor: colors.navy,
  },
  segGold: {
    backgroundColor: colors.gold,
  },
  segIdle: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.borderInput,
  },
  segLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  segLabelSmall: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  segUrdu: {
    fontFamily: fonts.urduBold,
    writingDirection: 'rtl',
    fontSize: 16,
    lineHeight: 30,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  volumeValue: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.navy,
  },
  repeatGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  repeatBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatActive: {
    backgroundColor: colors.navy,
  },
  repeatIdle: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.borderInput,
  },
  repeatText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#fff',
  },
  sourceLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.ink,
  },
  toggle: {
    width: 52,
    height: 30,
    borderRadius: radius.pill,
    justifyContent: 'center',
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  knobOn: {
    alignSelf: 'flex-end',
    marginRight: 3,
  },
  knobOff: {
    alignSelf: 'flex-start',
    marginLeft: 3,
  },
  linkCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkIcon: {
    fontSize: 20,
  },
  linkLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.ink,
  },
  linkChevron: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.disabled,
  },
});
