import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { categories, menuItems, featuredIds } from '../data/menuData';
import CategoryCard from '../components/CategoryCard';
import MenuItemCard from '../components/MenuItemCard';
import { useCart } from '../context/CartContext';

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const { addToCart, user } = useCart();

  const featured = useMemo(
    () => menuItems.filter((i) => featuredIds.includes(i.id)),
    []
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return menuItems.filter(
      (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>
              Hi {user?.name?.split(' ')[0] || 'there'} 👋
            </Text>
            <Text style={styles.location}>Delivering to Hyderabad</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.search}
            placeholder="Search for rotis, curries, biryani..."
            placeholderTextColor={colors.slate}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {query.trim() ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </Text>
            {filtered.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
                onAdd={() => addToCart(item, 1)}
              />
            ))}
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <FlatList
                data={categories}
                keyExtractor={(c) => c.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <CategoryCard
                    category={item}
                    onPress={() =>
                      navigation.navigate('Menu', { categoryId: item.id })
                    }
                  />
                )}
              />
            </View>

            <View style={styles.bannerWrap}>
              <View style={styles.banner}>
                <Text style={styles.bannerTitle}>Fresh Tandoor Rotis</Text>
                <Text style={styles.bannerSubtitle}>
                  Hand-rolled daily, served hot to your door
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Popular right now</Text>
                <Pressable onPress={() => navigation.navigate('Menu', { categoryId: null })}>
                  <Text style={styles.seeAll}>See all</Text>
                </Pressable>
              </View>
              {featured.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
                  onAdd={() => addToCart(item, 1)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
  },
  location: {
    fontSize: 13,
    color: colors.slate,
    marginTop: 2,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  search: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  bannerWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  banner: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#EAF5EC',
  },
});
