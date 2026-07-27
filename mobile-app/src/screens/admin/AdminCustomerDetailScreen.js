import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, FlatList, Pressable } from 'react-native';
import { colors, radii, spacing } from '../../theme/colors';
import Header from '../../components/Header';
import PrimaryButton from '../../components/PrimaryButton';
import StatusPill from '../../components/StatusPill';
import StatCard from '../../components/StatCard';
import { api } from '../../api/client';

export default function AdminCustomerDetailScreen({ route, navigation }) {
  const { mobile } = route.params;
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setCustomer(await api.get(`/customers/${mobile}`));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [mobile]);

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header title="Customer" onBack={() => navigation.goBack()} alertsScreen="AdminNotifications" />
        <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
      </View>
    );
  }
  if (error || !customer) {
    return (
      <View style={styles.screen}>
        <Header title="Customer" onBack={() => navigation.goBack()} alertsScreen="AdminNotifications" />
        <View style={styles.centered}><Text style={styles.errorText}>{error || 'Not found.'}</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header title={customer.name} subtitle={`${customer.customerId} · ${customer.mobile}`} onBack={() => navigation.goBack()} alertsScreen="AdminNotifications" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.address}>{customer.address}</Text>

        <PrimaryButton
          title="Message this customer"
          variant="outline"
          onPress={() => navigation.navigate('AdminNotifications', { toUserId: customer.userId, toName: customer.name })}
          style={{ marginTop: spacing.md, marginBottom: spacing.lg }}
        />

        <View style={styles.statGrid}>
          <StatCard size="compact" label="Purchased" value={`₹${customer.totalPurchase}`} />
          <StatCard size="compact" label="Paid" value={`₹${customer.totalPaid}`} />
          <StatCard
            size="compact"
            label="Pending"
            value={`₹${customer.pending}`}
            highlight={customer.pending > 0}
            onPress={customer.pending > 0 ? () => setShowPendingOnly((v) => !v) : undefined}
            active={showPendingOnly}
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{showPendingOnly ? 'Orders with balance due' : 'Orders'}</Text>
          {showPendingOnly ? (
            <Pressable onPress={() => setShowPendingOnly(false)}>
              <Text style={styles.showAll}>Show all</Text>
            </Pressable>
          ) : null}
        </View>
        <FlatList
          data={showPendingOnly
            ? customer.orders.filter((o) =>
                o.status !== 'rejected' && o.status !== 'cancelled' && o.total - o.paidAmount > 0)
            : customer.orders}
          keyExtractor={(o) => String(o.id)}
          scrollEnabled={false}
          renderItem={({ item: o }) => (
            <Pressable
              style={styles.orderRow}
              onPress={() => navigation.navigate('AdminOrdersTab', { screen: 'AdminOrderDetail', params: { orderId: o.id } })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.orderId}>#{o.id}</Text>
                <Text style={styles.muted}>{o.deliveryDate} · {o.deliveryTime}</Text>
              </View>
              <Text style={styles.orderTotal}>₹{o.total}</Text>
              <StatusPill status={o.status} />
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.muted}>
              {showPendingOnly ? 'No orders with a balance due.' : 'No orders yet.'}
            </Text>
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.danger, fontSize: 14 },
  muted: { color: colors.slate, fontSize: 12.5 },
  address: { fontSize: 13.5, color: colors.slate },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  showAll: { fontSize: 13, fontWeight: '700', color: colors.primary },
  orderRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  orderId: { fontSize: 14, fontWeight: '700', color: colors.ink },
  orderTotal: { fontSize: 13.5, fontWeight: '800', color: colors.primaryDark },
});
