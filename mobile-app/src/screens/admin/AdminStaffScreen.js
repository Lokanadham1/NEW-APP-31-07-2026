import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme/colors';
import Header from '../../components/Header';
import PrimaryButton from '../../components/PrimaryButton';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const ROLES = [
  { key: 'admin', label: 'Admin' },
  { key: 'delivery', label: 'Delivery' },
];

const ROLE_ICON = { admin: 'shield-checkmark-outline', delivery: 'bicycle-outline' };
const ROLE_LABEL = { admin: 'Admin', delivery: 'Delivery' };

export default function AdminStaffScreen() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('delivery');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setStaff(await api.get('/admin/staff'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const canAdd = /^\d{10}$/.test(mobile);

  const handleAdd = async () => {
    setFormError('');
    setSaving(true);
    try {
      await api.post('/admin/staff', { mobile, role, name: name.trim() || undefined });
      setMobile('');
      setName('');
      load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (member) => {
    Alert.alert(
      `Remove ${member.name || member.mobile}?`,
      `They'll lose ${ROLE_LABEL[member.role].toLowerCase()} access immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try {
              await api.del(`/admin/staff/${member.id}`);
              load();
            } catch (e) {
              Alert.alert('Could not remove', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <Header title="Staff" subtitle={`${staff.length} member${staff.length !== 1 ? 's' : ''}`} alertsScreen="AdminNotifications" />
      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : error ? (
        <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.form}>
              <Text style={styles.formTitle}>Add admin or delivery staff</Text>
              <Text style={styles.label}>Mobile number</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.slate}
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={(t) => setMobile(t.replace(/\D/g, ''))}
                maxLength={10}
              />
              <Text style={styles.label}>Name (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ramesh"
                placeholderTextColor={colors.slate}
                value={name}
                onChangeText={setName}
              />
              <Text style={styles.label}>Role</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {ROLES.map((r) => (
                  <Pressable
                    key={r.key}
                    style={[styles.roleChip, role === r.key && styles.roleChipActive]}
                    onPress={() => setRole(r.key)}
                  >
                    <Ionicons
                      name={ROLE_ICON[r.key]}
                      size={15}
                      color={role === r.key ? '#fff' : colors.ink}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.roleChipText, role === r.key && styles.roleChipTextActive]}>{r.label}</Text>
                  </Pressable>
                ))}
              </View>
              {formError ? <Text style={styles.formError}>{formError}</Text> : null}
              <PrimaryButton
                title="Add to staff"
                onPress={handleAdd}
                disabled={!canAdd || saving}
                loading={saving}
                style={{ marginTop: spacing.md }}
              />
              <Text style={styles.sectionTitle}>Current staff</Text>
            </View>
          }
          renderItem={({ item: s }) => (
            <View style={styles.row}>
              <View style={styles.roleIconWrap}>
                <Ionicons name={ROLE_ICON[s.role]} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{s.name || s.mobile}</Text>
                <Text style={styles.meta}>{ROLE_LABEL[s.role]} · {s.mobile}</Text>
              </View>
              {s.mobile !== user?.mobile ? (
                <Pressable onPress={() => handleRemove(s)} hitSlop={8} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              ) : (
                <Text style={styles.youTag}>You</Text>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.muted}>No staff added yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.danger, fontSize: 14 },
  muted: { color: colors.slate, fontSize: 13.5, paddingHorizontal: spacing.lg },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  form: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  formTitle: { fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: spacing.xs },
  label: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: 6, marginTop: spacing.md },
  input: {
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 14, color: colors.ink,
  },
  roleChip: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cream,
    borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 9,
  },
  roleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleChipText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  roleChipTextActive: { color: '#fff' },
  formError: { color: colors.danger, fontSize: 12.5, fontWeight: '600', marginTop: spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.ink, marginTop: spacing.lg },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  roleIconWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 12, color: colors.slate, marginTop: 2 },
  removeBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#FBEAE6',
    alignItems: 'center', justifyContent: 'center',
  },
  youTag: { fontSize: 11.5, fontWeight: '700', color: colors.slate },
});
