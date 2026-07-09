import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme/tokens';
import { useApp } from '../data/store';
import { formatRupees, SOURCE_META } from '../data/types';
import { announcementUrdu } from '../data/urduNumbers';
import { PulseRings } from '../components/PulseRings';
import { Icon } from '../components/Icon';

/**
 * Full-screen "incoming payment" moment: gold speaker with expanding rings,
 * huge amount, payer, Urdu line — shown while announcing.
 */
export function IncomingPaymentOverlay() {
  const { announcing, dismissAnnouncement, repeatAnnouncement, settings } = useApp();

  if (!announcing) return null;
  const meta = SOURCE_META[announcing.source];

  return (
    <Modal visible animationType="fade" onRequestClose={dismissAnnouncement}>
      <Pressable style={styles.root} onPress={dismissAnnouncement}>
        <View style={styles.goldStrip} />

        <PulseRings size={190} color="rgba(240,180,41,0.5)">
          <View style={styles.speaker}>
            <Icon name="speaker" size={54} color={colors.navy} />
          </View>
        </PulseRings>

        <View style={styles.sourcePill}>
          <View style={[styles.sourceDot, { backgroundColor: '#fff' }]}>
            {announcing.source === 'bank' ? (
              <Icon name="bank" size={12} color={meta.color} />
            ) : (
              <Text style={[styles.sourceDotText, { color: meta.color }]}>{meta.short}</Text>
            )}
          </View>
          <Text style={styles.sourceLabel}>{meta.label}</Text>
        </View>

        <View style={styles.amountBlock}>
          <Text style={styles.amount}>{formatRupees(announcing.amount)}</Text>
          <Text style={styles.payer}>from {announcing.payer}</Text>
        </View>

        {settings.language === 'ur' && (
          <View style={styles.urduBlock}>
            <Text style={styles.urduLine}>
              {announcementUrdu(announcing.source, announcing.amount)}
            </Text>
            <Text style={styles.announcing}>announcing…</Text>
          </View>
        )}

        <Pressable style={styles.repeatBtn} onPress={repeatAnnouncement}>
          <Icon name="repeat" size={20} color="#fff" />
          <Text style={styles.repeatLabel}>Repeat announcement</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26,
    overflow: 'hidden',
  },
  goldStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: colors.gold,
  },
  speaker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 16,
  },
  speakerIcon: {
    fontSize: 54,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(30,127,79,0.9)',
  },
  sourceDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceDotText: {
    fontFamily: fonts.bold,
    fontSize: 9.5,
  },
  sourceLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#fff',
  },
  amountBlock: {
    alignItems: 'center',
    gap: 4,
  },
  amount: {
    fontFamily: fonts.extrabold,
    fontSize: 72,
    lineHeight: 76,
    color: '#fff',
    letterSpacing: -2,
  },
  payer: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    color: colors.gold,
  },
  urduBlock: {
    alignItems: 'center',
    gap: 2,
  },
  urduLine: {
    fontFamily: fonts.urduSemibold,
    writingDirection: 'rtl',
    fontSize: 19,
    lineHeight: 40,
    color: colors.white90,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  announcing: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.white50,
  },
  repeatBtn: {
    position: 'absolute',
    bottom: 36,
    left: 20,
    right: 20,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.whiteOnNavy10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#fff',
  },
});
