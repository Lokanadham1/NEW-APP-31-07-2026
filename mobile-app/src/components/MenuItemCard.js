import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { iconForCategory } from '../theme/categoryIcons';

// The quantity in the middle of the stepper doubles as a text input, so a
// customer ordering in bulk can type "50" directly instead of tapping +49 times.
function QtyInput({ quantity, onSetQuantity }) {
  const [text, setText] = useState(String(quantity));

  // Stay in sync when quantity changes from outside (the +/- buttons, or
  // another screen updating the same cart entry) — but not while the field
  // is empty mid-edit, so a backspace-to-retype doesn't get overwritten.
  useEffect(() => { setText(String(quantity)); }, [quantity]);

  const commit = () => {
    const n = parseInt(text, 10);
    if (!text || Number.isNaN(n) || n <= 0) {
      setText(String(quantity));
    } else if (n !== quantity) {
      onSetQuantity(n);
    }
  };

  return (
    <TextInput
      style={styles.stepInput}
      value={text}
      onChangeText={(t) => setText(t.replace(/[^0-9]/g, ''))}
      onBlur={commit}
      onSubmitEditing={commit}
      keyboardType="number-pad"
      selectTextOnFocus
      maxLength={4}
    />
  );
}

// quantity: how many of this item are already in the cart (0 = not added).
// The stepper is always visible (no separate ADD button) — tapping + from 0
// adds the item, matching the cart screen's -/qty/+ control everywhere.
export default function MenuItemCard({ item, onPress, quantity = 0, onIncrease, onDecrease, onSetQuantity }) {
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
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepBtn}
            onPress={onDecrease}
            disabled={quantity === 0}
            hitSlop={8}
          >
            <Text style={[styles.stepBtnText, quantity === 0 && styles.stepBtnTextDisabled]}>–</Text>
          </Pressable>
          <QtyInput quantity={quantity} onSetQuantity={onSetQuantity} />
          <Pressable style={styles.stepBtn} onPress={onIncrease} hitSlop={8}>
            <Text style={styles.stepBtnText}>+</Text>
          </Pressable>
        </View>
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  stepBtnTextDisabled: {
    color: colors.border,
  },
  stepInput: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.ink,
    minWidth: 26,
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 2,
  },
});
