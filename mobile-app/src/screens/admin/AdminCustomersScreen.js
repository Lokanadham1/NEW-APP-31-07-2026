import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radii, spacing } from '../../theme/colors';
import Header from '../../components/Header';
import { api } from '../../api/client';

export default function AdminCustomersScreen({ route, navigation }) {
  const pendingOnly = !!route.params?.pendingOnly;
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (query) => {
    setLoading(true);
    setError('');
    try {
      setCustomers(await api.get(`/customers${query ? `?q=${encodeURIComponent(query)}` : ''}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(q); }, []));

  const shown = pendingOnly ? customers.filter((c) => c.pending > 0) : customers;

  return (
    <View style={styles.screen}>
      <Header
        title="Customers"
        subtitle={pendingOnly
          ? `${shown.length} with a balance due`
          : `${customers.length} customer${customers.length !== 1 ? 's' : ''}`}
        alertsScreen="AdminNotifications"
      />

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search by name, mobile, or customer ID"
          placeholderTextColor={colors.slate}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => load(q)}
          returnKeyType="search"
        />
      </View>

      {pendingOnly ? (
        <Pressable onPress={() => navigation.setParams({ pendingOnly: undefined })} style={styles.showAllWrap}>
          <Text style={styles.showAll}>Showing only customers with dues · Show all</Text>
        </Pressable>
      ) : null}

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : error ? (
        <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
      ) : shown.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.muted}>{pendingOnly ? 'No customers with a balance due.' : 'No customers found.'}</Text>
        </View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(c) => String(c.userId)}
          contentContainerStyle={styles.list}
          renderItem={({ item: c }) => (
            <Pressable style={styles.card} onPress={() => navigation.navigate('AdminCustomerDetail', { mobile: c.mobile })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.meta}>{c.customerId} · {c.mobile} · {c.orderCount} orders</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.purchased}>₹{c.totalPurchase}</Text>
                {c.pending > 0 ? <Text style={styles.pending}>₹{c.pending} due</Text> : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.danger, fontSize: 14 },
  muted: { color: colors.slate, fontSize: 13.5 },
  searchWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  showAllWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  showAll: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  search: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 14, color: colors.ink,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  name: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 12, color: colors.slate, marginTop: 2 },
  purchased: { fontSize: 13.5, fontWeight: '800', color: colors.primaryDark },
  pending: { fontSize: 11.5, fontWeight: '700', color: colors.danger, marginTop: 2 },
});
