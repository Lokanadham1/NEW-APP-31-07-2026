import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { menuItems } from '../data/menuData';
import Header from '../components/Header';
import PrimaryButton from '../components/PrimaryButton';
import { useCart } from '../context/CartContext';

export default function ItemDetailScreen({ route, navigation }) {
  const { itemId } = route.params;
  const item = useMemo(() => menuItems.find((i) => i.id === itemId), [itemId]);
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();

  if (!item) {
    return (
      <View style={styles.screen}>
        <Header title="Item not found" onBack={() => navigation.goBack()} />
      </View>
    );
  }

  const handleAdd = () => {
    addToCart(item, qty);
    navigation.navigate('Cart');
  };

  return (
    <View style={styles.screen}>
      <Header title="Dish details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.heroThumb}>
          <Text style={styles.heroEmoji}>🍽️</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View
              style={[
                styles.vegBox,
                { borderColor: item.veg ? colors.success : colors.danger },
              ]}
            >
              <View
                style={[
                  styles.vegDot,
                  { backgroundColor: item.veg ? colors.success : colors.danger },
                ]}
              />
            </View>
            <Text style={styles.name}>{item.name}</Text>
          </View>

          <Text style={styles.rating}>★ {item.rating} rating</Text>
          <Text style={styles.desc}>{item.description}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.price}</Text>

            <View style={styles.stepper}>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Text style={styles.stepBtnText}>–</Text>
              </Pressable>
              <Text style={styles.stepValue}>{qty}</Text>
              <Pressable style={styles.stepBtn} onPress={() => setQty((q) => q + 1)}>
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={`Add ${qty} to cart · ₹${item.price * qty}`}
          onPress={handleAdd}
          style={{ width: '100%' }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  heroThumb: {
    height: 200,
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 64,
  },
  body: {
    padding: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  vegBox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  vegDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    flexShrink: 1,
  },
  rating: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.goldDark,
    marginBottom: spacing.sm,
  },
  desc: {
    fontSize: 14.5,
    color: colors.slate,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  stepValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    minWidth: 24,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
