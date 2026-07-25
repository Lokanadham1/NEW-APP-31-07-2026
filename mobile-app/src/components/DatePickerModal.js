import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toIso(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function startOfToday() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

// A lightweight month-grid calendar (no native dependency, so it works in
// Expo Go without a rebuild). Past dates — and today, since delivery is
// scheduled at least a day out in this catering flow, matching the old
// chip-list's behavior — are disabled.
export default function DatePickerModal({ visible, value, onClose, onSelect }) {
  const today = startOfToday();
  const initial = value ? new Date(`${value}T00:00:00`) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const canGoPrev = viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const goPrev = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const cells = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const list = [];
    for (let i = 0; i < firstWeekday; i += 1) list.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) list.push(day);
    return list;
  }, [viewYear, viewMonth]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.headerRow}>
            <Pressable onPress={goPrev} disabled={!canGoPrev} hitSlop={10}>
              <Text style={[styles.navArrow, !canGoPrev && styles.navArrowDisabled]}>‹</Text>
            </Pressable>
            <Text style={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
            <Pressable onPress={goNext} hitSlop={10}>
              <Text style={styles.navArrow}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {DAY_LABELS.map((d, i) => (
              <Text key={i} style={styles.weekLabel}>{d}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, idx) => {
              if (day === null) return <View key={idx} style={styles.cell} />;
              const iso = toIso(viewYear, viewMonth, day);
              const cellDate = new Date(viewYear, viewMonth, day);
              const disabled = cellDate <= today;
              const selected = value === iso;
              return (
                <Pressable
                  key={idx}
                  style={[styles.cell, styles.dayCell, selected && styles.dayCellSelected]}
                  disabled={disabled}
                  onPress={() => { onSelect(iso); onClose(); }}
                >
                  <Text style={[
                    styles.dayText,
                    disabled && styles.dayTextDisabled,
                    selected && styles.dayTextSelected,
                  ]}>
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navArrow: {
    fontSize: 26,
    color: colors.primary,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
  },
  navArrowDisabled: {
    color: colors.border,
  },
  monthLabel: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.ink,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.slate,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCell: {
    borderRadius: CELL_SIZE / 2,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  dayTextDisabled: {
    color: colors.border,
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '800',
  },
  closeBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  closeBtnText: {
    color: colors.slate,
    fontWeight: '700',
    fontSize: 13.5,
  },
});
