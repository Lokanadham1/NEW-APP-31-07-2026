import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import PrimaryButton from '../components/PrimaryButton';

export default function OrderSuccessScreen({ route, navigation }) {
  const { orderId } = route.params;

  return (
    <View style={styles.screen}>
      <View style={styles.badge}>
        <Text style={styles.badgeIcon}>✓</Text>
      </View>
      <Text style={styles.title}>Order placed!</Text>
      <Text style={styles.subtitle}>
        Your order <Text style={styles.orderId}>{orderId}</Text> has been sent to the kitchen.
        You'll get updates as it's prepared and delivered.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estimated delivery</Text>
        <Text style={styles.cardValue}>35–45 minutes</Text>
      </View>

      <PrimaryButton
        title="Track my order"
        onPress={() => navigation.navigate('MainTabs', { screen: 'Orders' })}
        style={{ width: '100%', marginTop: spacing.lg }}
      />
      <PrimaryButton
        title="Back to home"
        variant="outline"
        onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        style={{ width: '100%', marginTop: spacing.sm }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  badgeIcon: {
    fontSize: 34,
    color: '#fff',
    fontWeight: '800',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.slate,
    textAlign: 'center',
    lineHeight: 20,
  },
  orderId: {
    fontWeight: '800',
    color: colors.primaryDark,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 12.5,
    color: colors.slate,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
});
