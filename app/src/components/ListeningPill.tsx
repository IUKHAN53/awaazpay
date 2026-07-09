import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme/tokens';

/** Green "Listening / سن رہا ہے" status pill with a pulsing live dot. */
export function ListeningPill({ showUrdu = true }: { showUrdu?: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.15] });

  return (
    <View style={styles.pill}>
      <View style={styles.dotWrap}>
        <Animated.View style={[styles.dotHalo, { transform: [{ scale }], opacity }]} />
        <View style={styles.dot} />
      </View>
      <Text style={styles.label}>Listening</Text>
      {showUrdu && (
        <Text style={styles.urdu}>
          سن رہا ہے
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(30,127,79,0.25)',
    borderWidth: 1.5,
    borderColor: colors.liveBorder,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  dotWrap: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotHalo: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.liveDot,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.liveDot,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.liveText,
  },
  urdu: {
    fontFamily: fonts.urduSemibold,
    writingDirection: 'rtl',
    fontSize: 12,
    lineHeight: 23,
    color: colors.liveTextDim,
  },
});
