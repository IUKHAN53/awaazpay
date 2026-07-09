import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ToastLib, { BaseToastProps, ToastConfig } from 'react-native-toast-message';
import { colors, fonts, radius } from '../theme/tokens';
import { Icon, IconName } from './Icon';

/**
 * Brand toast — the RN stand-in for SweetAlert toasts (SweetAlert2 is web-only).
 * Three intents share one card style with a coloured left rail + icon.
 */
function ToastCard({
  text1,
  text2,
  accent,
  icon,
}: BaseToastProps & { accent: string; icon: IconName }) {
  return (
    <View style={styles.card}>
      <View style={[styles.rail, { backgroundColor: accent }]} />
      <View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
        <Icon name={icon} size={20} color={accent} />
      </View>
      <View style={styles.textWrap}>
        {!!text1 && (
          <Text style={styles.title} numberOfLines={1}>
            {text1}
          </Text>
        )}
        {!!text2 && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: (props) => <ToastCard {...props} accent={colors.easypaisa} icon="check" />,
  error: (props) => <ToastCard {...props} accent={colors.error} icon="shield" />,
  info: (props) => <ToastCard {...props} accent={colors.navy} icon="speaker" />,
};

/** Convenience wrappers so screens don't import the lib directly. */
export const toast = {
  success: (text1: string, text2?: string) =>
    ToastLib.show({ type: 'success', text1, text2, position: 'top', topOffset: 60 }),
  error: (text1: string, text2?: string) =>
    ToastLib.show({ type: 'error', text1, text2, position: 'top', topOffset: 60, visibilityTime: 4000 }),
  info: (text1: string, text2?: string) =>
    ToastLib.show({ type: 'info', text1, text2, position: 'top', topOffset: 60 }),
};

const styles = StyleSheet.create({
  card: {
    width: '92%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    overflow: 'hidden',
  },
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.muted },
});
