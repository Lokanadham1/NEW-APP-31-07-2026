import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import Header from '../components/Header';
import PrimaryButton from '../components/PrimaryButton';
import { useCart } from '../context/CartContext';

function CartRow({ entry, onIncrease, onDecrease, onRemove }) {
  return (
    <View style={styles.row}>
      <View style={styles.thumb}>
        <Text style={{ fontSize: 22 }}>🍽️</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>{entry.item.name}</Text>
        <Text style={styles.price}>₹{entry.item.price} each</Text>
      </View>
      <View style={styles.stepper}>
        <Pressable style={styles.stepBtn} onPress={onDecrease}>
          <Text style={styles.stepBtnText}>–</Text>
        </Pressable>
        <Text style={styles.stepValue}>{entry.quantity}</Text>
        <Pressable style={styles.stepBtn} onPress={onIncrease}>
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function CartScreen({ navigation }) {
  const { items, updateQuantity, subtotal, removeFromCart } = useCart();

  if (items.length === 0) {
    return (
      <View style={styles.screen}>
        <Header title="Your cart" />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some delicious food to get started</Text>
          <PrimaryButton
            title="Browse menu"
            onPress={() => navigation.navigate('HomeTab')}
            style={{ marginTop: spacing.lg, paddingHorizontal: spacing.xl }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header title="Your cart" subtitle={`${items.length} item${items.length > 1 ? 's' : ''}`} />

      <FlatList
        data={items}
        keyExtractor={(e) => String(e.item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item: entry }) => (
          <CartRow
            entry={entry}
            onIncrease={() => updateQuantity(entry.item.id, entry.quantity + 1)}
            onDecrease={() => updateQuantity(entry.item.id, entry.quantity - 1)}
            onRemove={() => removeFromCart(entry.item.id)}
          />
        )}
      />

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>₹{subtotal}</Text>
        </View>
        <Text style={styles.summaryNote}>
          Final total is confirmed by Roti & More when your order is accepted.
        </Text>

        <PrimaryButton
          title="Proceed to checkout"
          onPress={() => navigation.navigate('Checkout')}
          style={{ width: '100%', marginTop: spacing.sm }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  name: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.ink,
  },
  price: {
    fontSize: 12.5,
    color: colors.slate,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  stepValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
    minWidth: 18,
    textAlign: 'center',
  },
  summary: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryNote: {
    fontSize: 12,
    color: colors.slate,
    marginBottom: spacing.sm,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: colors.slate,
    marginTop: 4,
    textAlign: 'center',
  },
});
