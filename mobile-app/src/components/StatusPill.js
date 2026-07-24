import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { STATUS_LABEL, STATUS_COLOR } from '../theme/orderStatus';

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
