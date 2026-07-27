import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';

// A single summary tile used on both the admin and customer dashboards —
// e.g. "Pending orders · 3". Wrap a row of these in a `statGrid`-styled View.
// Pass onPress to make it tappable (e.g. jump to that status's order list);
// omitted, it's just a plain display tile. size="compact" fits 3 per row
// instead of 2, for screens with many stat cards (the admin dashboard).
export default function StatCard({ label, value, highlight, onPress, size = 'default' }) {
  const Wrapper = onPress ? Pressable : View;
  const compact = size === 'compact';
  return (
    <Wrapper style={[styles.statCard, compact && styles.statCardCompact]} onPress={onPress}>
      <Text style={[styles.statLabel, compact && styles.statLabelCompact]}>{label}</Text>
      <Text style={[
        styles.statValue,
        compact && styles.statValueCompact,
        highlight && { color: colors.goldDark },
      ]}>
        {value}
      </Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  statCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statCardCompact: {
    width: '30%',
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  statLabel: { fontSize: 12, color: colors.slate },
  statLabelCompact: { fontSize: 10.5 },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 2 },
  statValueCompact: { fontSize: 17, marginTop: 1 },
});
