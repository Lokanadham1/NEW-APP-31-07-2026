import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/colors';
import { categories, menuItems } from '../data/menuData';
import Header from '../components/Header';
import CategoryCard from '../components/CategoryCard';
import MenuItemCard from '../components/MenuItemCard';
import { useCart } from '../context/CartContext';

export default function MenuScreen({ route, navigation }) {
  const initialCategoryId = route.params?.categoryId ?? null;
  const [activeCategory, setActiveCategory] = useState(initialCategoryId);
  const { addToCart } = useCart();

  const items = useMemo(
    () =>
      activeCategory
        ? menuItems.filter((i) => i.categoryId === activeCategory)
        : menuItems,
    [activeCategory]
  );

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
        keyExtractor={(i) => i.id}
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
