import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Pressable, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radii, spacing } from '../theme/colors';
import Header from '../components/Header';
import StatusPill from '../components/StatusPill';
import { STATUS_LABEL } from '../theme/orderStatus';
import { api } from '../api/client';

const FILTERS = ['all', 'pending', 'approved', 'preparing', 'ready', 'out_for_delivery', 'completed', 'rejected', 'cancelled'];
const FILTER_LABEL = { all: 'All', ...STATUS_LABEL };

export default function OrdersScreen({ navigation, route }) {
  const [status, setStatus] = useState(route.params?.status || 'all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // This screen stays mounted across tab switches, so a filter passed in
  // from elsewhere needs to be picked up even when it isn't the first render.
  useEffect(() => {
    if (route.params?.status) setStatus(route.params.status);
  }, [route.params?.status]);

  const load = useCallback(async (isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const rows = await api.get(`/orders?status=${status}`);
      setOrders(rows);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status]);

  useFocusEffect(useCallback(() => { load(false); }, [load]));

  return (
    <View style={styles.screen}>
      <Header title="Your orders" subtitle={`${orders.length} order${orders.length !== 1 ? 's' : ''}`} />

      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              style={[styles.chip, status === f && styles.chipActive]}
              onPress={() => setStatus(f)}
            >
              <Text style={[styles.chipText, status === f && styles.chipTextActive]}>
                {FILTER_LABEL[f] || f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.emptyWrap}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : error ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Couldn't load your orders</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>{status === 'all' ? 'No orders yet' : `No ${(FILTER_LABEL[status] || status).toLowerCase()} orders`}</Text>
          <Text style={styles.emptySubtitle}>
            {status === 'all' ? 'Your placed orders will show up here' : 'Try a different filter above'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          renderItem={({ item: order }) => (
            <Pressable style={styles.card} onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}>
              <View style={styles.cardTop}>
                <Text style={styles.orderId}>Order #{order.id}</Text>
                <StatusPill status={order.status} />
              </View>
              <Text style={styles.itemsLine} numberOfLines={2}>
                {order.items.map((e) => `${e.quantity}× ${e.name}`).join(', ')}
              </Text>
              <View style={styles.cardBottom}>
                <Text style={styles.date}>
                  {order.deliveryDate} at {order.deliveryTime}
                </Text>
                <Text style={styles.total}>₹{order.total}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  filterWrap: { marginBottom: spacing.sm },
  chip: {
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 8,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  chipTextActive: { color: '#fff' },
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
