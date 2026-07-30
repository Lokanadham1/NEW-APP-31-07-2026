import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing } from '../theme/colors';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import { api } from '../api/client';

// Same pragmatic "poll while focused" approach as the admin dashboard —
// no websocket infra, so this is the stand-in for "update automatically
// when an order is placed/updated".
const POLL_INTERVAL_MS = 20000;

export default function CustomerDashboardScreen() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Guards against a background poll and a manual pull-to-refresh landing
  // close together: without this, whichever request resolves last wins even
  // if it was actually the older one, which can flash stale numbers back in.
  const requestIdRef = useRef(0);
  const load = useCallback(async (isRefresh) => {
    const requestId = ++requestIdRef.current;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const dash = await api.get('/me/dashboard');
      if (requestId !== requestIdRef.current) return;
      setSummary(dash);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(e.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load(false);
    const timer = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]));

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header title="Dashboard" />
        <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header title="Dashboard" subtitle="Your account summary" />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.statGrid}>
          <StatCard label="Total orders" value={summary?.totalOrders ?? 0} />
          <StatCard label="Items ordered" value={summary?.totalItemsOrdered ?? 0} />
          <StatCard label="Quantity ordered" value={summary?.totalQuantityOrdered ?? 0} />
          <StatCard label="Total bill amount" value={`₹${summary?.totalBillAmount ?? 0}`} />
        </View>

        <View style={styles.statGrid}>
          <StatCard
            label="Outstanding / due"
            value={`₹${summary?.outstanding ?? 0}`}
            highlight={(summary?.outstanding ?? 0) > 0}
          />
        </View>

        <Text style={styles.note}>
          Rejected and cancelled orders aren't counted toward your bill or quantity totals.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', marginBottom: spacing.md },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  note: { fontSize: 12, color: colors.slate, marginTop: spacing.sm, lineHeight: 17 },
});
