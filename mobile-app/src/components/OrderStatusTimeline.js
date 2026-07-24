import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { STATUS_LABEL, PIPELINE } from '../theme/orderStatus';

// A vertical step-by-step timeline: Pending Approval -> Accepted -> Preparing
// -> Ready -> Out for Delivery -> Delivered. Rejected/cancelled orders show a
// single terminal state instead, since they left the happy path.
export default function OrderStatusTimeline({ status }) {
  if (status === 'rejected' || status === 'cancelled') {
    return (
      <View style={styles.terminalRow}>
        <View style={[styles.dot, styles.dotTerminal]} />
        <Text style={styles.terminalText}>{STATUS_LABEL[status]}</Text>
      </View>
    );
  }

  const currentIndex = PIPELINE.indexOf(status);

  return (
    <View>
      {PIPELINE.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        const isLast = index === PIPELINE.length - 1;
        return (
          <View key={step} style={styles.row}>
            <View style={styles.dotColumn}>
              <View style={[styles.dot, (done || active) && styles.dotFilled, active && styles.dotActive]} />
              {!isLast ? <View style={[styles.line, done && styles.lineFilled]} /> : null}
            </View>
            <View style={styles.labelColumn}>
              <Text style={[styles.label, (done || active) && styles.labelFilled]}>
                {STATUS_LABEL[step]}
              </Text>
              {step === 'out_for_delivery' && !done && !active ? (
                <Text style={styles.optionalNote}>if applicable</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  terminalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  terminalText: { fontSize: 14, fontWeight: '700', color: colors.danger },
  row: { flexDirection: 'row' },
  dotColumn: { alignItems: 'center', width: 20 },
  dot: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface,
  },
  dotFilled: { borderColor: colors.primary, backgroundColor: colors.primary },
  dotActive: { borderColor: colors.goldDark, backgroundColor: colors.goldDark },
  dotTerminal: { borderColor: colors.danger, backgroundColor: colors.danger },
  line: { width: 2, flex: 1, minHeight: 20, backgroundColor: colors.border, marginVertical: 2 },
  lineFilled: { backgroundColor: colors.primary },
  labelColumn: { flex: 1, paddingBottom: spacing.md, paddingLeft: spacing.sm },
  label: { fontSize: 13.5, color: colors.slate, fontWeight: '600' },
  labelFilled: { color: colors.ink, fontWeight: '800' },
  optionalNote: { fontSize: 11, color: colors.slate, fontStyle: 'italic', marginTop: 1 },
});
