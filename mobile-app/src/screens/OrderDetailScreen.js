import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radii, spacing } from '../theme/colors';
import Header from '../components/Header';
import PrimaryButton from '../components/PrimaryButton';
import { api } from '../api/client';

const TIME_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];

function nextDays(count) {
  const days = [];
  const today = new Date();
  for (let i = 1; i <= count; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

const STATUS_LABEL = {
  pending: 'Pending approval', approved: 'Approved', completed: 'Completed',
  rejected: 'Rejected', cancelled: 'Cancelled',
};

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(null); // null | 'reschedule' | 'address'
  const [newDate, setNewDate] = useState(null);
  const [newTime, setNewTime] = useState(null);
  const [newAddress, setNewAddress] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const o = await api.get(`/orders/${orderId}`);
      setOrder(o);
      setNewAddress(o.customerAddress);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const canCancel = order && order.status === 'pending' &&
    (Date.now() - new Date(order.createdAt).getTime()) < 6 * 3600 * 1000;
  const canReschedule = order && !order.rescheduleUsed && ['pending', 'approved'].includes(order.status);
  const canEditAddress = order && !order.addressEditUsed && ['pending', 'approved'].includes(order.status);

  const runAction = async (fn) => {
    setBusy(true);
    try {
      await fn();
      await load();
      setMode(null);
    } catch (e) {
      Alert.alert('Something went wrong', e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel this order?', 'This cannot be undone.', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, cancel', style: 'destructive', onPress: () => runAction(() => api.post(`/orders/${orderId}/cancel`)) },
    ]);
  };

  const handleReschedule = () => {
    if (!newDate || !newTime) return;
    runAction(() => api.post(`/orders/${orderId}/reschedule`, { deliveryDate: newDate, deliveryTime: newTime }));
  };

  const handleAddressSave = () => {
    if (!newAddress.trim()) return;
    runAction(() => api.put(`/orders/${orderId}/address`, { address: newAddress.trim() }));
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header title="Order details" onBack={() => navigation.goBack()} />
        <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.screen}>
        <Header title="Order details" onBack={() => navigation.goBack()} />
        <View style={styles.centered}><Text style={styles.errorText}>{error || 'Order not found.'}</Text></View>
      </View>
    );
  }

  const balance = Math.max(0, order.total - order.paidAmount);

  return (
    <View style={styles.screen}>
      <Header title={`Order #${order.id}`} subtitle={STATUS_LABEL[order.status] || order.status} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items</Text>
          {order.items.map((it, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>{it.quantity}× {it.name}</Text>
              <Text style={styles.itemPrice}>₹{it.price * it.quantity}</Text>
            </View>
          ))}
          <View style={[styles.itemRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{order.total}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery</Text>
          <Text style={styles.line}>{order.deliveryDate} at {order.deliveryTime}</Text>
          <Text style={styles.lineMuted}>{order.customerAddress}</Text>
          {order.remarks ? <Text style={styles.lineMuted}>Note: {order.remarks}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          <Text style={styles.line}>Paid: ₹{order.paidAmount} of ₹{order.total}</Text>
          {balance > 0 ? <Text style={styles.lineMuted}>Balance due: ₹{balance}</Text> : (
            <Text style={[styles.lineMuted, { color: colors.primary, fontWeight: '700' }]}>Fully paid</Text>
          )}
          {order.payments.length > 0 ? (
            <View style={{ marginTop: spacing.sm }}>
              {order.payments.map((p, idx) => (
                <Text key={idx} style={styles.paymentLine}>₹{p.amount} · {p.mode} · {p.date}</Text>
              ))}
            </View>
          ) : null}
        </View>

        {mode === 'reschedule' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>New delivery date & time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
              {nextDays(10).map((d) => (
                <Pressable key={d} style={[styles.chip, newDate === d && styles.chipActive]} onPress={() => setNewDate(d)}>
                  <Text style={[styles.chipText, newDate === d && styles.chipTextActive]}>{d}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {TIME_SLOTS.map((t) => (
                <Pressable key={t} style={[styles.chip, newTime === t && styles.chipActive]} onPress={() => setNewTime(t)}>
                  <Text style={[styles.chipText, newTime === t && styles.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>
            <PrimaryButton title="Confirm new time" onPress={handleReschedule} loading={busy} disabled={!newDate || !newTime}
              style={{ marginTop: spacing.md }} />
          </View>
        )}

        {mode === 'address' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>New delivery address</Text>
            <TextInput style={styles.addressInput} multiline value={newAddress} onChangeText={setNewAddress} />
            <PrimaryButton title="Save address" onPress={handleAddressSave} loading={busy} disabled={!newAddress.trim()}
              style={{ marginTop: spacing.md }} />
          </View>
        )}

        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          {canReschedule && mode !== 'reschedule' && (
            <PrimaryButton title="Reschedule delivery" variant="outline" onPress={() => setMode('reschedule')} />
          )}
          {canEditAddress && mode !== 'address' && (
            <PrimaryButton title="Edit delivery address" variant="outline" onPress={() => setMode('address')} />
          )}
          {canCancel && (
            <PrimaryButton title="Cancel order" variant="outline" onPress={handleCancel} loading={busy} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.danger, fontSize: 14, textAlign: 'center', padding: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.ink, marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemName: { fontSize: 13.5, color: colors.ink },
  itemPrice: { fontSize: 13.5, color: colors.ink, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, marginTop: 4 },
  totalLabel: { fontSize: 14.5, fontWeight: '800', color: colors.ink },
  totalValue: { fontSize: 14.5, fontWeight: '800', color: colors.primaryDark },
  line: { fontSize: 13.5, color: colors.ink, fontWeight: '600', marginBottom: 2 },
  lineMuted: { fontSize: 13, color: colors.slate, marginBottom: 2 },
  paymentLine: { fontSize: 12.5, color: colors.slate },
  chip: {
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cream,
    borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 8,
    marginRight: spacing.sm, marginBottom: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12.5, fontWeight: '700', color: colors.ink },
  chipTextActive: { color: '#fff' },
  addressInput: {
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.md, padding: spacing.md, fontSize: 14, color: colors.ink,
    minHeight: 70, textAlignVertical: 'top',
  },
});
