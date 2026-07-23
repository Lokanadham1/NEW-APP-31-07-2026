import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';

function VegBadge({ veg }) {
  return (
    <View style={[styles.vegBox, { borderColor: veg ? colors.success : colors.danger }]}>
      <View style={[styles.vegDot, { backgroundColor: veg ? colors.success : colors.danger }]} />
    </View>
  );
}

export default function MenuItemCard({ item, onPress, onAdd }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.thumb}>
        <Text style={styles.thumbEmoji}>🍽️</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <VegBadge veg={item.veg} />
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        </View>
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.bottomRow}>
          <Text style={styles.price}>₹{item.price}</Text>
          <Text style={styles.rating}>★ {item.rating}</Text>
        </View>
      </View>
      <Pressable onPress={onAdd} style={styles.addBtn} hitSlop={8}>
        <Text style={styles.addBtnText}>ADD</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  thumbEmoji: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  vegBox: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    flexShrink: 1,
  },
  desc: {
    fontSize: 12.5,
    color: colors.slate,
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.goldDark,
  },
  addBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.primaryLight,
  },
  addBtnText: {
    color: colors.primaryDark,
    fontWeight: '800',
    fontSize: 12,
  },
});
