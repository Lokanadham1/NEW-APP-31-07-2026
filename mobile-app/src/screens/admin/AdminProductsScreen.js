import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radii, spacing } from '../../theme/colors';
import Header from '../../components/Header';
import PrimaryButton from '../../components/PrimaryButton';
import { api } from '../../api/client';

export default function AdminProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setProducts(await api.get('/products', { auth: false }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (p) => {
    Alert.alert(`Delete "${p.name}"?`, "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/products/${p.id}`);
            load();
          } catch (e) {
            Alert.alert('Could not delete', e.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <Header
        title="Products"
        subtitle={`${products.length} item${products.length !== 1 ? 's' : ''}`}
        right={
          <Pressable onPress={() => navigation.navigate('AdminProductForm', {})}>
            <Text style={styles.addLink}>+ Add</Text>
          </Pressable>
        }
      />

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : error ? (
        <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item: p }) => (
            <View style={styles.card}>
              {p.imageUrl ? (
                <Image source={{ uri: p.imageUrl }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.meta}>{p.category || '—'} · ₹{p.price}</Text>
                {p.status === 'out_of_stock' ? <Text style={styles.outOfStock}>Out of stock</Text> : null}
              </View>
              <View style={{ gap: 6 }}>
                <PrimaryButton title="Edit" variant="outline" style={styles.smallBtn}
                  onPress={() => navigation.navigate('AdminProductForm', { product: p })} />
                <PrimaryButton title="Delete" variant="outline" style={[styles.smallBtn, { borderColor: colors.danger }]}
                  onPress={() => handleDelete(p)} />
              </View>
            </View>
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
  addLink: { fontSize: 14, fontWeight: '800', color: colors.primary },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md,
  },
  thumb: { width: 48, height: 48, borderRadius: radii.sm },
  thumbPlaceholder: { backgroundColor: colors.primaryLight },
  name: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 12.5, color: colors.slate, marginTop: 2 },
  outOfStock: { fontSize: 11.5, fontWeight: '700', color: colors.danger, marginTop: 2 },
  smallBtn: { paddingVertical: 6, paddingHorizontal: 12, minWidth: 70 },
});
