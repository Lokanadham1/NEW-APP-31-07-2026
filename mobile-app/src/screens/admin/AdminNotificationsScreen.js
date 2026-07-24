import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radii, spacing } from '../../theme/colors';
import Header from '../../components/Header';
import PrimaryButton from '../../components/PrimaryButton';
import { api } from '../../api/client';

export default function AdminNotificationsScreen({ route }) {
  const [notifications, setNotifications] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [recipientId, setRecipientId] = useState(route.params?.toUserId ?? null);
  const [recipientName, setRecipientName] = useState(route.params?.toName ?? null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [notifs, custs] = await Promise.all([api.get('/notifications'), api.get('/customers')]);
      setNotifications(notifs);
      setCustomers(custs);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (route.params?.toUserId) {
      setRecipientId(route.params.toUserId);
      setRecipientName(route.params.toName);
    }
  }, [route.params?.toUserId, route.params?.toName]);

  const handleSend = async () => {
    setSending(true);
    setError('');
    setSentMsg('');
    try {
      const body = { message: message.trim() };
      if (recipientId) body.userId = recipientId;
      const res = await api.post('/notifications/send', body);
      setSentMsg(recipientId ? 'Sent.' : `Sent to ${res.sentTo} customer${res.sentTo !== 1 ? 's' : ''}.`);
      setMessage('');
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="Notifications" subtitle="Admin" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Send a message</Text>
          <Text style={styles.cardSubtitle}>
            Delivered as an in-app notification, and as a push if the customer's device is registered.
          </Text>

          <Text style={styles.label}>To</Text>
          <Pressable style={styles.recipientPicker} onPress={() => setPickerOpen((v) => !v)}>
            <Text style={styles.recipientText}>{recipientName || 'All customers'}</Text>
            <Text style={styles.recipientChevron}>{pickerOpen ? '▲' : '▼'}</Text>
          </Pressable>

          {pickerOpen && (
            <View style={styles.pickerList}>
              <Pressable
                style={styles.pickerRow}
                onPress={() => { setRecipientId(null); setRecipientName(null); setPickerOpen(false); }}
              >
                <Text style={styles.pickerRowText}>All customers</Text>
              </Pressable>
              {customers.map((c) => (
                <Pressable
                  key={c.userId}
                  style={styles.pickerRow}
                  onPress={() => { setRecipientId(c.userId); setRecipientName(c.name); setPickerOpen(false); }}
                >
                  <Text style={styles.pickerRowText}>{c.name} · {c.mobile}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={styles.messageInput}
            multiline
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message…"
            placeholderTextColor={colors.slate}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {sentMsg ? <Text style={styles.successText}>{sentMsg}</Text> : null}

          <PrimaryButton
            title={sending ? 'Sending…' : recipientId ? 'Send' : 'Broadcast to all customers'}
            onPress={handleSend}
            disabled={sending || !message.trim()}
            loading={sending}
            style={{ marginTop: spacing.md }}
          />
        </View>

        <Text style={styles.sectionTitle}>Activity</Text>
        <Text style={styles.cardSubtitle}>
          Automatic notifications from customer actions — new orders, cancellations, reschedules, address changes.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(n) => String(n.id)}
            scrollEnabled={false}
            renderItem={({ item: n }) => (
              <View style={styles.activityRow}>
                <Text style={styles.activityMessage}>{n.message}</Text>
                <Text style={styles.activityDate}>{n.createdDate}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.muted}>Nothing yet.</Text>}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
  cardSubtitle: { fontSize: 12.5, color: colors.slate, marginTop: 4, lineHeight: 17 },
  label: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: 6, marginTop: spacing.md },
  recipientPicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  recipientText: { fontSize: 14, color: colors.ink, fontWeight: '600' },
  recipientChevron: { fontSize: 11, color: colors.slate },
  pickerList: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, marginTop: 6,
    maxHeight: 220, overflow: 'hidden',
  },
  pickerRow: { paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  pickerRowText: { fontSize: 13.5, color: colors.ink },
  messageInput: {
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.md, padding: spacing.md, fontSize: 14, color: colors.ink,
    minHeight: 80, textAlignVertical: 'top',
  },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', marginTop: spacing.sm },
  successText: { color: colors.primary, fontSize: 13, fontWeight: '700', marginTop: spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: 2 },
  muted: { color: colors.slate, fontSize: 13, marginTop: spacing.sm },
  activityRow: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginTop: spacing.sm,
  },
  activityMessage: { fontSize: 13.5, color: colors.ink, lineHeight: 19 },
  activityDate: { fontSize: 11.5, color: colors.slate, marginTop: 4 },
});
