import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import Header from '../components/Header';
import PrimaryButton from '../components/PrimaryButton';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const TIME_SLOTS = [
  { value: '09:00', label: '9:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '19:00', label: '7:00 PM' },
];

function nextDays(count) {
  const days = [];
  const today = new Date();
  for (let i = 1; i <= count; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const label = i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    days.push({ value: iso, label });
  }
  return days;
}

export default function CheckoutScreen({ navigation }) {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const days = useMemo(() => nextDays(10), []);

  const [deliveryDate, setDeliveryDate] = useState(null);
  const [deliveryTime, setDeliveryTime] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canPlace = !!deliveryDate && !!deliveryTime && items.length > 0;

  const handlePlaceOrder = async () => {
    setError('');
    setLoading(true);
    try {
      const order = await api.post('/orders', {
        items: items.map((e) => ({ productId: e.item.id, quantity: e.quantity })),
        deliveryDate,
        deliveryTime,
        remarks: remarks.trim() || undefined,
      });
      clearCart();
      navigation.replace('OrderSuccess', { orderId: order.id });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="Checkout" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivering to</Text>
          <Text style={styles.userLine}>{user?.cateringName || user?.name} · {user?.mobile}</Text>
          <Text style={styles.addressLine}>{user?.address}</Text>
          <Text style={styles.addressHint}>You can change your delivery address from Profile.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {days.map((d) => (
              <Pressable
                key={d.value}
                style={[styles.chip, deliveryDate === d.value && styles.chipActive]}
                onPress={() => setDeliveryDate(d.value)}
              >
                <Text style={[styles.chipText, deliveryDate === d.value && styles.chipTextActive]}>{d.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery time</Text>
          <View style={styles.slotGrid}>
            {TIME_SLOTS.map((t) => (
              <Pressable
                key={t.value}
                style={[styles.chip, deliveryTime === t.value && styles.chipActive]}
                onPress={() => setDeliveryTime(t.value)}
              >
                <Text style={[styles.chipText, deliveryTime === t.value && styles.chipTextActive]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes for the kitchen (optional)</Text>
          <TextInput
            style={styles.remarksInput}
            placeholder="e.g. less spicy, contact person on arrival"
            placeholderTextColor={colors.slate}
            multiline
            value={remarks}
            onChangeText={setRemarks}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</Text>
            <Text style={styles.billValue}>₹{subtotal}</Text>
          </View>
          <Text style={styles.billNote}>
            Final total is confirmed by Roti & More when your order is accepted. Payment is
            collected separately — no online payment is taken at checkout.
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={`Place order · ₹${subtotal}`}
          onPress={handlePlaceOrder}
          disabled={!canPlace}
          loading={loading}
          style={{ width: '100%' }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  userLine: {
    fontSize: 13.5,
    color: colors.ink,
    fontWeight: '600',
  },
  addressLine: {
    fontSize: 13,
    color: colors.slate,
    marginTop: 2,
  },
  addressHint: {
    fontSize: 11.5,
    color: colors.slate,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  chipTextActive: {
    color: '#fff',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  remarksInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.ink,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  billLabel: { fontSize: 13.5, color: colors.slate },
  billValue: { fontSize: 13.5, color: colors.ink, fontWeight: '600' },
  billNote: {
    fontSize: 12,
    color: colors.slate,
    marginTop: spacing.sm,
    lineHeight: 17,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
