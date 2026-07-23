import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { iconForCategory } from '../theme/categoryIcons';

export default function MenuItemCard({ item, onPress, onAdd }) {
  const available = item.status !== 'out_of_stock';

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.thumb}>
        <Text style={styles.thumbEmoji}>{iconForCategory(item.category)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.bottomRow}>
          <Text style={styles.price}>₹{item.price}</Text>
          {!available ? <Text style={styles.outOfStock}>Out of stock</Text> : null}
        </View>
      </View>
      {available ? (
        <Pressable onPress={onAdd} style={styles.addBtn} hitSlop={8}>
          <Text style={styles.addBtnText}>ADD</Text>
        </Pressable>
      ) : null}
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
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 2,
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
  outOfStock: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.danger,
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
