import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radii, spacing } from '../../theme/colors';
import Header from '../../components/Header';
import PrimaryButton from '../../components/PrimaryButton';
import StatusPill from '../../components/StatusPill';
import { api } from '../../api/client';

const TIME_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank Transfer'];

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

export default function AdminOrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(null); // null | 'reschedule' | 'payment'
  const [newDate, setNewDate] = useState(null);
  const [newTime, setNewTime] = useState(null);
  const [amount, setAmount] = useState('');
  const [payMode, setPayMode] = useState('Cash');
  const [txnId, setTxnId] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setOrder(await api.get(`/orders/${orderId}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const run = async (fn) => {
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
      <Header title={`Order #${order.id}`} onBack={() => navigation.goBack()} right={<StatusPill status={order.status} />} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <Text style={styles.line}>{order.customerName} · {order.customerMobile}</Text>
          <Text style={styles.lineMuted}>{order.customerAddress}</Text>
        </View>

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
          {order.remarks ? <Text style={styles.lineMuted}>Note: {order.remarks}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          <Text style={styles.line}>Paid ₹{order.paidAmount} of ₹{order.total}</Text>
          {balance > 0 ? <Text style={styles.lineMuted}>Balance due: ₹{balance}</Text> : (
            <Text style={[styles.lineMuted, { color: colors.primary, fontWeight: '700' }]}>Fully paid</Text>
          )}
          {order.payments.map((p, idx) => (
            <Text key={idx} style={styles.paymentLine}>₹{p.amount} · {p.mode} · {p.date}</Text>
          ))}
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
            <PrimaryButton
              title="Confirm reschedule"
              loading={busy}
              disabled={!newDate || !newTime}
              onPress={() => run(() => api.post(`/orders/${orderId}/reschedule`, { deliveryDate: newDate, deliveryTime: newTime }))}
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}

        {mode === 'payment' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Record a payment (balance ₹{balance})</Text>
            <TextInput
              style={styles.addressInput}
              placeholder="Amount"
              keyboardType="number-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm }}>
              {PAYMENT_MODES.map((m) => (
                <Pressable key={m} style={[styles.chip, payMode === m && styles.chipActive]} onPress={() => setPayMode(m)}>
                  <Text style={[styles.chipText, payMode === m && styles.chipTextActive]}>{m}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={[styles.addressInput, { marginTop: spacing.sm }]}
              placeholder="Transaction ID (optional)"
              value={txnId}
              onChangeText={setTxnId}
            />
            <PrimaryButton
              title="Save payment"
              loading={busy}
              disabled={!amount || Number(amount) <= 0}
              onPress={() => run(() => api.post(`/orders/${orderId}/payments`, {
                amount: Number(amount), mode: payMode, transactionId: txnId || undefined,
              }))}
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}

        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          {order.status === 'pending' && (
            <>
              <PrimaryButton title="Accept order" loading={busy} onPress={() => run(() => api.post(`/orders/${orderId}/accept`))} />
              <PrimaryButton
                title="Reject order"
                variant="outline"
                loading={busy}
                onPress={() => Alert.alert('Reject this order?', 'This cannot be undone.', [
                  { text: 'No', style: 'cancel' },
                  { text: 'Yes, reject', style: 'destructive', onPress: () => run(() => api.post(`/orders/${orderId}/reject`)) },
                ])}
              />
            </>
          )}
          {order.status === 'approved' && (
            <PrimaryButton title="Mark delivered" loading={busy} onPress={() => run(() => api.post(`/orders/${orderId}/deliver`))} />
          )}
          {['pending', 'approved'].includes(order.status) && mode !== 'reschedule' && (
            <PrimaryButton title="Reschedule delivery" variant="outline" onPress={() => setMode('reschedule')} />
          )}
          {balance > 0 && mode !== 'payment' && (
            <PrimaryButton title="Record payment" variant="outline" onPress={() => setMode('payment')} />
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
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.md,
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
  },
});
