import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

/**
 * Expanding concentric rings (the "ap-ring" animation from the design).
 * Two rings phase-offset by half the duration. Cheap: transform+opacity only.
 */
export function PulseRings({
  size,
  color,
  duration = 1600,
  borderWidth = 3,
  children,
}: {
  size: number;
  color: string;
  duration?: number;
  borderWidth?: number;
  children?: React.ReactNode;
}) {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const make = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );
    const la = make(a, 0);
    const lb = make(b, duration / 2);
    la.start();
    lb.start();
    return () => {
      la.stop();
      lb.stop();
    };
  }, [a, b, duration]);

  const ring = (v: Animated.Value): Animated.WithAnimatedObject<ViewStyle> => ({
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }],
    opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
  });

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.ring,
          { borderColor: color, borderWidth, borderRadius: size / 2 },
          ring(a),
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          { borderColor: color, borderWidth, borderRadius: size / 2 },
          ring(b),
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
