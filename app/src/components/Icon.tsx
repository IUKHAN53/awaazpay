import React from 'react';
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome6,
} from '@expo/vector-icons';
import { colors } from '../theme/tokens';

/**
 * Single semantic icon surface for the whole app, so screens never reference a
 * specific icon family (or emoji) directly. Swap the mapping here to restyle
 * globally.
 */
export type IconName =
  | 'home'
  | 'history'
  | 'reports'
  | 'settings'
  | 'listening'
  | 'speaker'
  | 'mute'
  | 'bell'
  | 'battery'
  | 'voice'
  | 'repeat'
  | 'shield'
  | 'lock'
  | 'staff'
  | 'invite'
  | 'bank'
  | 'check'
  | 'chevron-right'
  | 'chevron-left'
  | 'female'
  | 'male'
  | 'calendar'
  | 'trend-up'
  | 'trend-down'
  | 'close';

type Family = 'mci' | 'ion' | 'fa6';

const MAP: Record<IconName, { family: Family; name: string }> = {
  home: { family: 'mci', name: 'home-variant' },
  history: { family: 'mci', name: 'receipt-text-outline' },
  reports: { family: 'mci', name: 'chart-box-outline' },
  settings: { family: 'mci', name: 'cog-outline' },
  listening: { family: 'mci', name: 'ear-hearing' },
  speaker: { family: 'mci', name: 'volume-high' },
  mute: { family: 'mci', name: 'volume-off' },
  bell: { family: 'mci', name: 'bell-ring-outline' },
  battery: { family: 'mci', name: 'battery-charging-high' },
  voice: { family: 'mci', name: 'account-voice' },
  repeat: { family: 'mci', name: 'repeat-variant' },
  shield: { family: 'mci', name: 'shield-check' },
  lock: { family: 'mci', name: 'lock' },
  staff: { family: 'mci', name: 'account-group' },
  invite: { family: 'mci', name: 'cellphone-message' },
  bank: { family: 'mci', name: 'bank' },
  check: { family: 'mci', name: 'check-bold' },
  'chevron-right': { family: 'mci', name: 'chevron-right' },
  'chevron-left': { family: 'mci', name: 'chevron-left' },
  female: { family: 'mci', name: 'face-woman' },
  male: { family: 'mci', name: 'face-man' },
  calendar: { family: 'mci', name: 'calendar-month-outline' },
  'trend-up': { family: 'mci', name: 'trending-up' },
  'trend-down': { family: 'mci', name: 'trending-down' },
  close: { family: 'ion', name: 'close' },
};

export function Icon({
  name,
  size = 22,
  color = colors.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const { family, name: iconName } = MAP[name];
  if (family === 'ion') return <Ionicons name={iconName as any} size={size} color={color} />;
  if (family === 'fa6') return <FontAwesome6 name={iconName as any} size={size} color={color} />;
  return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
}
