import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, FlatList, Pressable } from 'react-native';
import { colors, radii, spacing } from '../../theme/colors';
import Header from '../../components/Header';
import PrimaryButton from '../../components/PrimaryButton';
import StatusPill from '../../components/StatusPill';
import { api } from '../../api/client';

export default function AdminCustomerDetailScreen({ route, navigation }) {
  const { mobile } = route.params;
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        <Header title="Customer" onBack={() => navigation.goBack()} />
        <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
      </View>
    );
  }
  if (error || !customer) {
    return (
      <View style={styles.screen}>
        <Header title="Customer" onBack={() => navigation.goBack()} />
        <View style={styles.centered}><Text style={styles.errorText}>{error || 'Not found.'}</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header title={customer.name} subtitle={`${customer.customerId} · ${customer.mobile}`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.address}>{customer.address}</Text>

        <PrimaryButton
          title="Message this customer"
          variant="outline"
          onPress={() => navigation.navigate('AdminNotificationsTab', { screen: 'AdminNotifications', params: { toUserId: customer.userId, toName: customer.name } })}
          style={{ marginTop: spacing.md, marginBottom: spacing.lg }}
        />

        <View style={styles.statGrid}>
          <StatCard label="Purchased" value={`₹${customer.totalPurchase}`} />
          <StatCard label="Paid" value={`₹${customer.totalPaid}`} />
          <StatCard label="Pending" value={`₹${customer.pending}`} highlight={customer.pending > 0} />
        </View>

        <Text style={styles.sectionTitle}>Orders</Text>
        <FlatList
          data={customer.orders}
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
          ListEmptyComponent={<Text style={styles.muted}>No orders yet.</Text>}
        />
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && { color: colors.danger }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.danger, fontSize: 14 },
  muted: { color: colors.slate, fontSize: 12.5 },
  address: { fontSize: 13.5, color: colors.slate },
  statGrid: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md,
  },
  statLabel: { fontSize: 11.5, color: colors.slate },
  statValue: { fontSize: 17, fontWeight: '800', color: colors.ink, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.sm },
  orderRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  orderId: { fontSize: 14, fontWeight: '700', color: colors.ink },
  orderTotal: { fontSize: 13.5, fontWeight: '800', color: colors.primaryDark },
});
