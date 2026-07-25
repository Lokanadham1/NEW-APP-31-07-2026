import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { iconForCategory } from '../theme/categoryIcons';

// The quantity in the middle of the stepper doubles as a text input, so a
// customer ordering in bulk can type "500000" directly instead of tapping.
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
      maxLength={6}
    />
  );
}

// quantity: how many of this item are already in the cart (0 = not added).
// The stepper is always visible (no separate ADD button) — tapping + from 0
// adds the item, matching the cart screen's -/qty/+ control everywhere.
//
// Layout: thumb sits beside a text column (name, then the full description
// — no truncation — directly under it), and price + stepper share a bottom
// row spanning the full card width underneath.
export default function MenuItemCard({ item, onPress, quantity = 0, onIncrease, onDecrease, onSetQuantity }) {
  const available = item.status !== 'out_of_stock';

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.thumb}>
          <Text style={styles.thumbEmoji}>{iconForCategory(item.category)}</Text>
        </View>
        <View style={styles.textCol}>
          <Text style={styles.name}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.desc}>{item.description}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.priceCol}>
          <Text style={styles.price}>₹{item.price}</Text>
          {!available ? <Text style={styles.outOfStock}>Out of stock</Text> : null}
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
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  thumbEmoji: {
    fontSize: 22,
  },
  textCol: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  desc: {
    fontSize: 12.5,
    color: colors.slate,
    lineHeight: 18,
    marginTop: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  priceCol: {
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
