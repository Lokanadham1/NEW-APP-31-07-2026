import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const STATUS_LABEL = {
  pending: 'Pending approval',
  approved: 'Approved',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};
const STATUS_COLOR = {
  pending: colors.goldDark,
  approved: colors.primary,
  completed: colors.primaryDark,
  rejected: colors.danger,
  cancelled: colors.slate,
};

export default function StatusPill({ status }) {
  const color = STATUS_COLOR[status] || colors.slate;
  return (
    <View style={[styles.pill, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.pillText, { color }]}>{STATUS_LABEL[status] || status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 11.5, fontWeight: '700' },
});
