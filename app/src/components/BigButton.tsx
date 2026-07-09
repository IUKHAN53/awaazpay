import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius } from '../theme/tokens';

/**
 * Chunky CTA with a hard bottom shadow (design: gold "Start listening ▸",
 * red "Fix it now ▸"). Press collapses the shadow for a tactile push.
 */
export function BigButton({
  label,
  onPress,
  variant = 'gold',
  height = 60,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'gold' | 'danger' | 'navy';
  height?: number;
}) {
  const bg =
    variant === 'gold' ? colors.gold : variant === 'danger' ? colors.error : colors.navy;
  const shadow =
    variant === 'gold' ? colors.goldDark : variant === 'danger' ? colors.errorDark : '#101d47';
  const fg = variant === 'gold' ? colors.navy : '#fff';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          height,
          backgroundColor: bg,
          shadowColor: shadow,
          borderBottomWidth: pressed ? 0 : 4,
          borderBottomColor: shadow,
          transform: [{ translateY: pressed ? 4 : 0 }],
        },
      ]}
    >
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
  },
});
