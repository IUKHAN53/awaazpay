import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts } from '../theme/tokens';
import { PaymentSource, SOURCE_META } from '../data/types';
import { Icon } from './Icon';

/** Circular EP / JC text badge, or a bank icon, in the source's brand color. */
export function SourceBadge({
  source,
  size = 40,
}: {
  source: PaymentSource;
  size?: number;
}) {
  const meta = SOURCE_META[source];
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: meta.color },
      ]}
    >
      {source === 'bank' ? (
        <Icon name="bank" size={size * 0.5} color="#fff" />
      ) : (
        <Text style={[styles.label, { fontSize: size * 0.33 }]}>{meta.short}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.bold,
    color: '#fff',
  },
});
