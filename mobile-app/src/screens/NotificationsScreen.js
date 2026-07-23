import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radii, spacing } from '../theme/colors';
import Header from '../components/Header';
import { api } from '../api/client';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const rows = await api.get('/notifications');
      setNotifications(rows);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(false); }, [load]));

  const markRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try { await api.post(`/notifications/${id}/read`); } catch { /* best-effort */ }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try { await api.post('/notifications/read-all'); } catch { /* best-effort */ }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header title="Notifications" onBack={() => navigation.goBack()} />
        <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header
        title="Notifications"
        onBack={() => navigation.goBack()}
        right={unreadCount > 0 ? (
          <Pressable onPress={markAllRead}><Text style={styles.markAll}>Mark all read</Text></Pressable>
        ) : null}
      />
      {notifications.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => String(n.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, !item.read && styles.rowUnread]}
              onPress={() => !item.read && markRead(item.id)}
            >
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.date}>{item.createdDate}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  markAll: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowUnread: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  message: { fontSize: 13.5, color: colors.ink, marginBottom: 4, lineHeight: 19 },
  date: { fontSize: 11.5, color: colors.slate },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
});
