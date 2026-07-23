import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';

function StatusPill({ status }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{status}</Text>
    </View>
  );
}

export default function OrdersScreen() {
  const { orders } = useCart();

  return (
    <View style={styles.screen}>
      <Header title="Your orders" subtitle={`${orders.length} order${orders.length !== 1 ? 's' : ''}`} />

      {orders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Your placed orders will show up here</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          renderItem={({ item: order }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.orderId}>{order.id}</Text>
                <StatusPill status={order.status} />
              </View>
              <Text style={styles.itemsLine} numberOfLines={2}>
                {order.items.map((e) => `${e.quantity}× ${e.item.name}`).join(', ')}
              </Text>
              <View style={styles.cardBottom}>
                <Text style={styles.date}>
                  {new Date(order.placedAt).toLocaleString()}
                </Text>
                <Text style={styles.total}>₹{order.total}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.ink,
  },
  pill: {
    backgroundColor: colors.primaryLight,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  itemsLine: {
    fontSize: 13,
    color: colors.slate,
    marginBottom: 8,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 11.5,
    color: colors.slate,
  },
  total: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: colors.slate,
    marginTop: 4,
    textAlign: 'center',
  },
});
