import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TextInput,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../theme/colors';
import { iconForCategory } from '../theme/categoryIcons';
import CategoryCard from '../components/CategoryCard';
import MenuItemCard from '../components/MenuItemCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductsContext';
import { useNotificationsBadge } from '../context/NotificationsContext';
import { useAdminPhone } from '../context/AdminPhoneContext';

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();
  const { items: cartItems, addToCart, updateQuantity, setQuantity } = useCart();
  const { user } = useAuth();
  const { products, loading, error, refresh } = useProducts();
  const { unreadCount } = useNotificationsBadge();
  const { callAdmin } = useAdminPhone();

  const categories = useMemo(() => {
    const names = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return names.map((name) => ({ id: name, name, emoji: iconForCategory(name) }));
  }, [products]);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter(
      (i) => i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q)
    );
  }, [query, products]);

  const qtyFor = (itemId) => cartItems.find((e) => e.item.id === itemId)?.quantity || 0;

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.lg }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>
              Hi {(user?.name || user?.cateringName || 'there').split(' ')[0]} 👋
            </Text>
            <Text style={styles.location}>{user?.address || 'Add your delivery address'}</Text>
          </View>
          <View style={styles.topBarActions}>
            <Pressable onPress={callAdmin} style={styles.callBtn} hitSlop={10}>
              <Ionicons name="call-outline" size={18} color={colors.primaryDark} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.callBtn} hitSlop={10}>
              <Ionicons name="notifications-outline" size={19} color={colors.primaryDark} />
              {unreadCount > 0 ? (
                <View style={styles.alertsBadge}>
                  <Text style={styles.alertsBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.search}
            placeholder="Search the menu..."
            placeholderTextColor={colors.slate}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {error ? (
          <View style={styles.section}>
            <Text style={styles.errorText}>Couldn't load the menu: {error}</Text>
            <Pressable onPress={refresh}><Text style={styles.retryText}>Tap to retry</Text></Pressable>
          </View>
        ) : query.trim() ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </Text>
            {filtered.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
                quantity={qtyFor(item.id)}
                onIncrease={() => addToCart(item, 1)}
                onDecrease={() => updateQuantity(item.id, qtyFor(item.id) - 1)}
                onSetQuantity={(qty) => setQuantity(item, qty)}
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
                    onPress={() => navigation.navigate('Menu', { categoryId: item.id })}
                  />
                )}
              />
            </View>

            <View style={styles.bannerWrap}>
              <View style={styles.banner}>
                <Text style={styles.bannerTitle}>Fresh Tandoor Rotis</Text>
                <Text style={styles.bannerSubtitle}>
                  Hand-rolled daily, made to order for your event
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Full menu</Text>
                <Pressable onPress={() => navigation.navigate('Menu', { categoryId: null })}>
                  <Text style={styles.seeAll}>See all</Text>
                </Pressable>
              </View>
              {products.slice(0, 6).map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
                  quantity={qtyFor(item.id)}
                  onIncrease={() => addToCart(item, 1)}
                  onDecrease={() => updateQuantity(item.id, qtyFor(item.id) - 1)}
                  onSetQuantity={(qty) => setQuantity(item, qty)}
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
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
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertsBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertsBadgeText: {
    color: '#fff',
    fontSize: 9.5,
    fontWeight: '800',
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
  errorText: {
    color: colors.danger,
    fontSize: 13.5,
  },
  retryText: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: 6,
  },
});
