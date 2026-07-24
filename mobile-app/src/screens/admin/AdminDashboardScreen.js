import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radii, spacing } from '../../theme/colors';
import Header from '../../components/Header';
import StatusPill from '../../components/StatusPill';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboardScreen({ navigation }) {
  const { logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [o, c] = await Promise.all([api.get('/orders'), api.get('/customers')]);
      setOrders(o);
      setCustomers(c);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(false); }, [load]));

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header title="Dashboard" />
        <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
      </View>
    );
  }

  const pending = orders.filter((o) => o.status === 'pending');
  const approved = orders.filter((o) => o.status === 'approved');
  const totalPending = customers.reduce((s, c) => s + c.pending, 0);
  const recent = orders.slice(0, 8);

  const handleLogout = async () => {
    await logout();
    navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={styles.screen}>
      <Header
        title="Dashboard"
        subtitle="Admin"
        right={<Pressable onPress={handleLogout}><Text style={styles.logoutLink}>Log out</Text></Pressable>}
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.statGrid}>
          <StatCard label="Pending orders" value={pending.length} highlight={pending.length > 0} />
          <StatCard label="Approved" value={approved.length} />
          <StatCard label="Customers" value={customers.length} />
          <StatCard label="Outstanding" value={`₹${totalPending}`} highlight={totalPending > 0} />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent orders</Text>
          <Pressable onPress={() => navigation.navigate('AdminOrdersTab')}>
            <Text style={styles.seeAll}>View all</Text>
          </Pressable>
        </View>

        {recent.length === 0 ? (
          <Text style={styles.muted}>No orders yet.</Text>
        ) : (
          recent.map((o) => (
            <Pressable
              key={o.id}
              style={styles.orderRow}
              onPress={() => navigation.navigate('AdminOrdersTab', { screen: 'AdminOrderDetail', params: { orderId: o.id } })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.orderId}>#{o.id} · {o.customerName}</Text>
                <Text style={styles.muted}>₹{o.total}</Text>
              </View>
              <StatusPill status={o.status} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && { color: colors.goldDark }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', marginBottom: spacing.md },
  logoutLink: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statLabel: { fontSize: 12, color: colors.slate },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 2 },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
  seeAll: { fontSize: 13, fontWeight: '700', color: colors.primary },
  muted: { color: colors.slate, fontSize: 13.5 },
  orderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  orderId: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 2 },
});
