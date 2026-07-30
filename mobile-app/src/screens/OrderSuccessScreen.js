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
        Your order <Text style={styles.orderId}>#{orderId}</Text> has been sent to Roti & More.
        You'll get a notification once it's accepted, and again when it's on its way.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status</Text>
        <Text style={styles.cardValue}>Pending approval</Text>
      </View>

      <PrimaryButton
        title="Track my order"
        onPress={() => {
          // Reset the Home stack behind us first, so a later tap on the Home
          // tab lands on Home rather than this screen (this was still on top
          // of the Home stack since it's nested there, not a standalone route).
          navigation.popToTop();
          navigation.navigate('MainTabs', {
            screen: 'OrdersTab',
            params: { screen: 'OrderDetail', params: { orderId } },
          });
        }}
        style={{ width: '100%', marginTop: spacing.lg }}
      />
      <PrimaryButton
        title="Back to home"
        variant="outline"
        onPress={() => navigation.popToTop()}
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
