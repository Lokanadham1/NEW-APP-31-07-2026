import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme/colors';
import Header from '../../components/Header';
import StatusPill from '../../components/StatusPill';
import StatCard from '../../components/StatCard';
import DatePickerModal from '../../components/DatePickerModal';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

// How often to re-poll the dashboard while it's the focused screen. There's
// no websocket/realtime infra in this app, so polling is the pragmatic
// stand-in for "auto-update when a new/completed/cancelled order arrives".
const POLL_INTERVAL_MS = 20000;

const todayIso = () => new Date().toISOString().split('T')[0];

function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminDashboardScreen({ navigation }) {
  const { logout } = useAuth();
  const [summary, setSummary] = useState(null); // { date, totalToday, pendingToday, acceptedToday, completedToday, products }
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const isToday = selectedDate === todayIso();

  const load = useCallback(async (isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [dash, o, c] = await Promise.all([
        api.get(`/admin/dashboard?date=${selectedDate}`), api.get('/orders'), api.get('/customers'),
      ]);
      setSummary(dash);
      setOrders(o);
      setCustomers(c);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  // Refresh on focus/date change, then keep polling quietly (no spinner)
  // while focused — but only when viewing today, since a past day's
  // production won't change.
  useFocusEffect(useCallback(() => {
    load(false);
    if (!isToday) return undefined;
    const timer = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load, isToday]));

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header title="Dashboard" alertsScreen="AdminNotifications" />
        <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
      </View>
    );
  }

  const totalPending = customers.reduce((s, c) => s + c.pending, 0);
  const recent = orders.slice(0, 8);
  const products = summary?.products || [];

  const handleLogout = async () => {
    await logout();
    navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const goToOrders = (status) => () =>
    navigation.navigate('AdminOrdersTab', { screen: 'AdminOrders', params: { status } });

  return (
    <View style={styles.screen}>
      <Header
        title="Dashboard"
        subtitle="Admin"
        right={<Pressable onPress={handleLogout}><Text style={styles.logoutLink}>Log out</Text></Pressable>}
        alertsScreen="AdminNotifications"
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{isToday ? "Today's production" : `Production for ${formatDate(selectedDate)}`}</Text>
          {!isToday ? (
            <Pressable onPress={() => setSelectedDate(todayIso())}>
              <Text style={styles.seeAll}>Back to today</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable style={styles.dateField} onPress={() => setDatePickerOpen(true)}>
          <Ionicons name="calendar-outline" size={16} color={colors.slate} />
          <Text style={styles.dateFieldText}>{formatDate(selectedDate)}</Text>
          <Text style={styles.dateFieldChange}>Change</Text>
        </Pressable>
        <DatePickerModal
          visible={datePickerOpen}
          value={selectedDate}
          onClose={() => setDatePickerOpen(false)}
          onSelect={setSelectedDate}
          disablePastAndToday={false}
          disableFuture
        />

        <View style={styles.statGrid}>
          <StatCard label="Total orders today" value={summary?.totalToday ?? 0} onPress={goToOrders('all')} />
          <StatCard
            label="Pending"
            value={summary?.pendingToday ?? 0}
            highlight={(summary?.pendingToday ?? 0) > 0}
            onPress={goToOrders('pending')}
          />
          <StatCard label="Accepted" value={summary?.acceptedToday ?? 0} onPress={goToOrders('approved')} />
          <StatCard label="Completed" value={summary?.completedToday ?? 0} onPress={goToOrders('completed')} />
        </View>

        <View style={styles.statGrid}>
          <StatCard label="Customers" value={customers.length} onPress={() => navigation.navigate('AdminCustomersTab')} />
          <StatCard label="Outstanding" value={`₹${totalPending}`} highlight={totalPending > 0} onPress={() => navigation.navigate('AdminCustomersTab')} />
        </View>

        <Text style={styles.sectionTitle}>All-time</Text>
        <View style={styles.statGrid}>
          <StatCard label="Total orders (all-time)" value={summary?.totalOrdersAllTime ?? 0} onPress={goToOrders('all')} />
          <StatCard label="Total revenue (all-time)" value={`₹${summary?.totalRevenueAllTime ?? 0}`} />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{isToday ? "Today's items" : 'Items for that day'}</Text>
        </View>
        {products.length === 0 ? (
          <Text style={[styles.muted, { marginBottom: spacing.lg }]}>
            {isToday ? 'No orders placed today yet.' : 'No orders were placed on that day.'}
          </Text>
        ) : (
          <View style={[styles.card, { marginBottom: spacing.lg }]}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Product</Text>
              <Text style={styles.tableHeaderCell}>Ordered</Text>
              <Text style={styles.tableHeaderCell}>Done</Text>
              <Text style={styles.tableHeaderCell}>Left</Text>
            </View>
            {products.map((p) => (
              <View key={p.productId} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2, fontWeight: '700' }]} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.tableCell}>{p.orderedQty}</Text>
                <Text style={styles.tableCell}>{p.completedQty}</Text>
                <Text style={[styles.tableCell, p.remainingQty > 0 && { color: colors.goldDark, fontWeight: '800' }]}>
                  {p.remainingQty}
                </Text>
              </View>
            ))}
          </View>
        )}

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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', marginBottom: spacing.md },
  logoutLink: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md,
  },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm, marginBottom: spacing.sm },
  tableHeaderCell: { flex: 1, fontSize: 11.5, fontWeight: '700', color: colors.slate, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  tableCell: { flex: 1, fontSize: 13.5, color: colors.ink },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: spacing.sm },
  seeAll: { fontSize: 13, fontWeight: '700', color: colors.primary },
  muted: { color: colors.slate, fontSize: 13.5 },
  dateField: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: 10,
    marginBottom: spacing.md, alignSelf: 'flex-start',
  },
  dateFieldText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  dateFieldChange: { fontSize: 12, fontWeight: '700', color: colors.primary, marginLeft: spacing.xs },
  orderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  orderId: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 2 },
});
