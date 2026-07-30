import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';

export default function PrimaryButton({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'outline' | 'gold'
  disabled = false,
  loading = false,
  style,
}) {
  const isOutline = variant === 'outline';
  const isGold = variant === 'gold';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isOutline && styles.outline,
        isGold && styles.gold,
        !isOutline && !isGold && styles.filled,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : '#fff'} />
      ) : (
        <Text
          style={[
            styles.text,
            isOutline && { color: colors.primary },
            isGold && { color: colors.ink },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: {
    backgroundColor: colors.primary,
  },
  gold: {
    backgroundColor: colors.gold,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
