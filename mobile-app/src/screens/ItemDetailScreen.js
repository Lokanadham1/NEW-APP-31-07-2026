import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { iconForCategory } from '../theme/categoryIcons';
import Header from '../components/Header';
import PrimaryButton from '../components/PrimaryButton';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';

export default function ItemDetailScreen({ route, navigation }) {
  const { itemId } = route.params;
  const { products } = useProducts();
  const item = useMemo(() => products.find((i) => i.id === itemId), [itemId, products]);
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();

  if (!item) {
    return (
      <View style={styles.screen}>
        <Header title="Item not found" onBack={() => navigation.goBack()} />
      </View>
    );
  }

  const available = item.status !== 'out_of_stock';

  const handleAdd = () => {
    addToCart(item, qty);
    navigation.navigate('Cart');
  };

  return (
    <View style={styles.screen}>
      <Header title="Dish details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.heroThumb}>
          <Text style={styles.heroEmoji}>{iconForCategory(item.category)}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{item.name}</Text>
          {item.category ? <Text style={styles.category}>{item.category}</Text> : null}
          {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}

          {!available ? (
            <View style={styles.outOfStockBanner}>
              <Text style={styles.outOfStockText}>Currently out of stock</Text>
            </View>
          ) : null}

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.price}</Text>

            {available ? (
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
            ) : null}
          </View>
        </View>
      </ScrollView>

      {available ? (
        <View style={styles.footer}>
          <PrimaryButton
            title={`Add ${qty} to cart · ₹${item.price * qty}`}
            onPress={handleAdd}
            style={{ width: '100%' }}
          />
        </View>
      ) : null}
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
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 4,
  },
  category: {
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
  outOfStockBanner: {
    backgroundColor: '#FBEAE6',
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  outOfStockText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
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
