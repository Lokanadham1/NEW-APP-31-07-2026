import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../theme/colors';
import { iconForCategory } from '../theme/categoryIcons';
import Header from '../components/Header';
import CategoryCard from '../components/CategoryCard';
import MenuItemCard from '../components/MenuItemCard';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';

export default function MenuScreen({ route, navigation }) {
  const initialCategoryId = route.params?.categoryId ?? null;
  const [activeCategory, setActiveCategory] = useState(initialCategoryId);
  const { addToCart } = useCart();
  const { products, loading } = useProducts();

  const categories = useMemo(() => {
    const names = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return names.map((name) => ({ id: name, name, emoji: iconForCategory(name) }));
  }, [products]);

  const items = useMemo(
    () =>
      activeCategory
        ? products.filter((i) => i.category === activeCategory)
        : products,
    [activeCategory, products]
  );

  if (loading) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header title="Full Menu" subtitle={`${items.length} dishes`} onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />

      <View style={styles.chipsWrap}>
        <FlatList
          data={[{ id: null, name: 'All', emoji: '🍽️' }, ...categories]}
          keyExtractor={(c) => String(c.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          renderItem={({ item }) => (
            <CategoryCard
              category={item}
              selected={activeCategory === item.id}
              onPress={() => setActiveCategory(item.id)}
            />
          )}
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <MenuItemCard
            item={item}
            onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
            onAdd={() => addToCart(item, 1)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  chipsWrap: {
    marginBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
