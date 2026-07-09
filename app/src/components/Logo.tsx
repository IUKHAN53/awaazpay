import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme/tokens';

/**
 * AwaazPay mark: a rounded navy tile holding a gold "Rs" + three rising
 * sound bars (money + awaaz/voice). The currency is rendered as "Rs" text
 * rather than the ₨ glyph so it looks identical on every device/font
 * (Poppins draws ₨ as a "Rs" ligature anyway, and system fonts vary).
 */
export function LogoMark({ size = 36, onNavy = true }: { size?: number; onNavy?: boolean }) {
  const s = size / 36; // scale relative to the 36px reference
  const barColor = colors.gold;
  const tileBg = onNavy ? colors.whiteOnNavy10 : colors.navy;
  const rsColor = onNavy ? '#fff' : colors.gold;
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: 10 * s, gap: 3 * s, backgroundColor: tileBg },
      ]}
    >
      <Text style={[styles.rs, { fontSize: 12 * s, color: rsColor }]}>Rs</Text>
      <View style={[styles.bars, { gap: 2 * s }]}>
        <View style={[styles.bar, { width: 2.5 * s, height: 6 * s, backgroundColor: barColor }]} />
        <View style={[styles.bar, { width: 2.5 * s, height: 12 * s, backgroundColor: barColor }]} />
        <View style={[styles.bar, { width: 2.5 * s, height: 8 * s, backgroundColor: barColor }]} />
        <View style={[styles.bar, { width: 2.5 * s, height: 4 * s, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

/** "AwaazPay" wordmark. On navy headers keep light; on cream use navy. */
export function Wordmark({ size = 16, onNavy = true }: { size?: number; onNavy?: boolean }) {
  return (
    <Text
      style={{
        fontFamily: fonts.extrabold,
        fontSize: size,
        color: onNavy ? '#fff' : colors.navy,
        letterSpacing: -0.5,
      }}
    >
      Awaaz
      <Text style={{ color: onNavy ? colors.gold : colors.goldDark }}>Pay</Text>
    </Text>
  );
}

export function LogoRow({
  tileSize = 36,
  textSize = 16,
  onNavy = true,
}: {
  tileSize?: number;
  textSize?: number;
  onNavy?: boolean;
}) {
  return (
    <View style={styles.row}>
      <LogoMark size={tileSize} onNavy={onNavy} />
      <Wordmark size={textSize} onNavy={onNavy} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  rs: {
    fontFamily: fonts.extrabold,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bar: {
    borderRadius: radius.pill,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
});
