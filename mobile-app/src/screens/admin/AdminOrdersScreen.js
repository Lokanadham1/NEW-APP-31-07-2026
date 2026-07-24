import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Pressable, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radii, spacing } from '../../theme/colors';
import Header from '../../components/Header';
import StatusPill from '../../components/StatusPill';
import { api } from '../../api/client';

const FILTERS = ['all', 'pending', 'approved', 'completed', 'rejected', 'cancelled'];

export default function AdminOrdersScreen({ navigation }) {
  const [status, setStatus] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      setOrders(await api.get(`/orders?status=${status}`));
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
      <Header title="Orders" subtitle={`${orders.length} order${orders.length !== 1 ? 's' : ''}`} />

      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              style={[styles.chip, status === f && styles.chipActive]}
              onPress={() => setStatus(f)}
            >
              <Text style={[styles.chipText, status === f && styles.chipTextActive]}>
                {f[0].toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : error ? (
        <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}><Text style={styles.muted}>No orders here.</Text></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          renderItem={({ item: o }) => (
            <Pressable style={styles.card} onPress={() => navigation.navigate('AdminOrderDetail', { orderId: o.id })}>
              <View style={styles.cardTop}>
                <Text style={styles.orderId}>#{o.id} · {o.customerName}</Text>
                <StatusPill status={o.status} />
              </View>
              <Text style={styles.itemsLine} numberOfLines={1}>
                {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
              </Text>
              <View style={styles.cardBottom}>
                <Text style={styles.date}>{o.deliveryDate} at {o.deliveryTime}</Text>
                <Text style={styles.total}>₹{o.total}</Text>
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.danger, fontSize: 14 },
  muted: { color: colors.slate, fontSize: 13.5 },
  filterWrap: { marginBottom: spacing.sm },
  chip: {
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 8,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderId: { fontSize: 14.5, fontWeight: '800', color: colors.ink, flexShrink: 1, paddingRight: spacing.sm },
  itemsLine: { fontSize: 13, color: colors.slate, marginBottom: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontSize: 11.5, color: colors.slate },
  total: { fontSize: 13.5, fontWeight: '800', color: colors.primaryDark },
});
