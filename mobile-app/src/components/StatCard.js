import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';

// A single summary tile used on both the admin and customer dashboards —
// e.g. "Pending orders · 3". Wrap a row of these in a `statGrid`-styled View.
// Pass onPress to make it tappable (e.g. jump to that status's order list);
// omitted, it's just a plain display tile.
export default function StatCard({ label, value, highlight, onPress }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper style={styles.statCard} onPress={onPress}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && { color: colors.goldDark }]}>{value}</Text>
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
  statLabel: { fontSize: 12, color: colors.slate },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 2 },
});
