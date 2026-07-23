import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import Header from '../components/Header';
import PrimaryButton from '../components/PrimaryButton';
import { useCart } from '../context/CartContext';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on delivery' },
  { id: 'upi', label: 'UPI' },
  { id: 'card', label: 'Credit / Debit card' },
];

export default function CheckoutScreen({ navigation }) {
  const { subtotal, placeOrder, user } = useCart();
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState('cod');
  const deliveryFee = 30;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = () => {
    const order = placeOrder();
    navigation.replace('OrderSuccess', { orderId: order.id });
  };

  return (
    <View style={styles.screen}>
      <Header title="Checkout" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivering to</Text>
          <Text style={styles.userLine}>{user?.name} · {user?.phone}</Text>
          <TextInput
            style={styles.addressInput}
            placeholder="Flat / house no., street, area, landmark"
            placeholderTextColor={colors.slate}
            multiline
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment method</Text>
          {PAYMENT_METHODS.map((m) => (
            <Pressable
              key={m.id}
              style={[styles.paymentRow, payment === m.id && styles.paymentRowActive]}
              onPress={() => setPayment(m.id)}
            >
              <View style={[styles.radio, payment === m.id && styles.radioActive]}>
                {payment === m.id && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.paymentLabel}>{m.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>₹{subtotal}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery fee</Text>
            <Text style={styles.billValue}>₹{deliveryFee}</Text>
          </View>
          <View style={[styles.billRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total payable</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={`Place order · ₹${total}`}
          onPress={handlePlaceOrder}
          disabled={!address.trim()}
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
    color: colors.slate,
    marginBottom: spacing.sm,
  },
  addressInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.ink,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: 4,
  },
  paymentRowActive: {
    backgroundColor: colors.primaryLight,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  paymentLabel: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: '600',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  billLabel: { fontSize: 13.5, color: colors.slate },
  billValue: { fontSize: 13.5, color: colors.ink, fontWeight: '600' },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: { fontSize: 15, fontWeight: '800', color: colors.ink },
  totalValue: { fontSize: 16, fontWeight: '800', color: colors.primaryDark },
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
