import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, layout } from '../theme/tokens';
import { Icon, IconName } from './Icon';

export type Tab = 'home' | 'history' | 'reports';

const TABS: { key: Tab; icon: IconName; label: string }[] = [
  { key: 'home', icon: 'home', label: 'Home' },
  { key: 'history', icon: 'history', label: 'History' },
  { key: 'reports', icon: 'reports', label: 'Reports' },
];

export function TabBar({
  active,
  onChange,
  bottomInset = 0,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  bottomInset?: number;
}) {
  return (
    <View style={[styles.bar, { paddingBottom: bottomInset }]}>
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Pressable
            key={t.key}
            style={styles.tab}
            onPress={() => onChange(t.key)}
          >
            <Icon
              name={t.icon}
              size={24}
              color={isActive ? colors.navy : colors.faint}
            />
            <Text
              style={[
                styles.label,
                isActive ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
    backgroundColor: colors.card,
  },
  tab: {
    flex: 1,
    height: layout.tabBarHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
  },
  labelActive: {
    fontFamily: fonts.bold,
    color: colors.navy,
  },
  labelInactive: {
    fontFamily: fonts.semibold,
    color: colors.ink,
  },
});
