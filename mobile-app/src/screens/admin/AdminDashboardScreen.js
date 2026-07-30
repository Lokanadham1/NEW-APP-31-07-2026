import { useCallback, useMemo, useRef, useState } from 'react';
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

function startOfWeekIso() {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // back to Monday
  return d.toISOString().split('T')[0];
}

function startOfMonthIso() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
}

function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// 'custom' has no label — it renders as an icon-only chip (see below).
const FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'custom' },
];

export default function AdminDashboardScreen({ navigation }) {
  const { logout } = useAuth();
  const [summary, setSummary] = useState(null); // { from, to, totalToday, pendingToday, acceptedToday, completedToday, products }
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filterMode, setFilterMode] = useState('today');
  const [customDate, setCustomDate] = useState(todayIso());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const range = useMemo(() => {
    if (filterMode === 'week') return { from: startOfWeekIso(), to: todayIso() };
    if (filterMode === 'month') return { from: startOfMonthIso(), to: todayIso() };
    if (filterMode === 'custom') return { from: customDate, to: customDate };
    return { from: todayIso(), to: todayIso() };
  }, [filterMode, customDate]);
  const includesToday = range.to === todayIso();

  // Guards against out-of-order responses: switching filters quickly, or a
  // background poll landing while a manual refresh is still in flight, can
  // make an older request's response arrive *after* a newer one's — without
  // this, that stale response would silently overwrite the correct numbers.
  const requestIdRef = useRef(0);
  const load = useCallback(async (isRefresh) => {
    const requestId = ++requestIdRef.current;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [dash, o, c] = await Promise.all([
        api.get(`/admin/dashboard?from=${range.from}&to=${range.to}`), api.get('/orders'), api.get('/customers'),
      ]);
      if (requestId !== requestIdRef.current) return; // superseded by a newer request
      setSummary(dash);
      setOrders(o);
      setCustomers(c);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(e.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [range.from, range.to]);

  // Refresh on focus/filter change, then keep polling quietly (no spinner)
  // while focused — but only when the range includes today, since a fully
  // past range's numbers won't change.
  useFocusEffect(useCallback(() => {
    load(false);
    if (!includesToday) return undefined;
    const timer = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load, includesToday]));

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

        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filterMode === f.key;
            if (f.key === 'custom') {
              // Icon-only chip — no "Custom" label, just the calendar icon
              // (showing the picked date once one is selected). Same tap
              // behavior: selects this filter and opens the date picker.
              return (
                <Pressable
                  key={f.key}
                  style={[styles.filterChip, styles.filterChipIconOnly, active && styles.filterChipActive]}
                  onPress={() => { setFilterMode('custom'); setDatePickerOpen(true); }}
                >
                  <Ionicons name="calendar-outline" size={15} color={active ? '#fff' : colors.ink} />
                  {active ? (
                    <Text style={[styles.filterChipText, styles.filterChipTextActive, { marginLeft: 4 }]}>
                      {formatDate(customDate)}
                    </Text>
                  ) : null}
                </Pressable>
              );
            }
            return (
              <Pressable
                key={f.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilterMode(f.key)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <DatePickerModal
          visible={datePickerOpen}
          value={customDate}
          onClose={() => setDatePickerOpen(false)}
          onSelect={setCustomDate}
          disablePastAndToday={false}
          disableFuture
        />

        <Text style={styles.sectionTitle}>
          {filterMode === 'today' && "Today's production"}
          {filterMode === 'week' && "This week's production"}
          {filterMode === 'month' && "This month's production"}
          {filterMode === 'custom' && `Production for ${formatDate(customDate)}`}
        </Text>
        <View style={styles.statGrid}>
          <StatCard size="compact" label="Total orders" value={summary?.totalToday ?? 0} onPress={goToOrders('all')} />
          <StatCard
            size="compact"
            label="Pending"
            value={summary?.pendingToday ?? 0}
            highlight={(summary?.pendingToday ?? 0) > 0}
            onPress={goToOrders('pending')}
          />
          <StatCard size="compact" label="Accepted" value={summary?.acceptedToday ?? 0} onPress={goToOrders('approved')} />
          <StatCard size="compact" label="Completed" value={summary?.completedToday ?? 0} onPress={goToOrders('completed')} />
          <StatCard
            size="compact"
            label="Customers"
            value={customers.length}
            onPress={() => navigation.navigate('AdminCustomersTab', { screen: 'AdminCustomers', params: { pendingOnly: undefined } })}
          />
          <StatCard
            size="compact"
            label="Outstanding"
            value={`₹${totalPending}`}
            highlight={totalPending > 0}
            onPress={() => navigation.navigate('AdminCustomersTab', { screen: 'AdminCustomers', params: { pendingOnly: true } })}
          />
        </View>

        <Text style={styles.sectionTitle}>All-time</Text>
        <View style={styles.statGrid}>
          <StatCard size="compact" label="Total orders" value={summary?.totalOrdersAllTime ?? 0} onPress={goToOrders('all')} />
          <StatCard size="compact" label="Total revenue" value={`₹${summary?.totalRevenueAllTime ?? 0}`} />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {filterMode === 'today' && "Today's items"}
            {filterMode === 'week' && "This week's items"}
            {filterMode === 'month' && "This month's items"}
            {filterMode === 'custom' && 'Items for that day'}
          </Text>
        </View>
        {products.length === 0 ? (
          <Text style={[styles.muted, { marginBottom: spacing.lg }]}>
            No orders were placed in this period.
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
  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipIconOnly: { paddingHorizontal: 10 },
  filterChipText: { fontSize: 12.5, fontWeight: '700', color: colors.ink },
  filterChipTextActive: { color: '#fff' },
  orderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  orderId: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 2 },
});
