import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { useCart } from '../context/CartContext';

const MENU_ROWS = [
  { icon: '📍', label: 'Saved addresses' },
  { icon: '💳', label: 'Payment methods' },
  { icon: '🔔', label: 'Notifications' },
  { icon: '❓', label: 'Help & support' },
  { icon: '📄', label: 'Terms & Privacy Policy' },
];

export default function ProfileScreen({ navigation }) {
  const { user, setUser, orders } = useCart();

  const handleLogout = () => {
    setUser(null);
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.avatar} />
        <Text style={styles.name}>{user?.name || 'Guest'}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{orders.length}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
        </View>
      </View>

      <View style={styles.menu}>
        {MENU_ROWS.map((row) => (
          <Pressable key={row.label} style={styles.menuRow}>
            <Text style={styles.menuIcon}>{row.icon}</Text>
            <Text style={styles.menuLabel}>{row.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  phone: {
    fontSize: 13,
    color: colors.slate,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  statLabel: {
    fontSize: 11.5,
    color: colors.slate,
    marginTop: 2,
  },
  menu: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14.5,
    color: colors.ink,
    fontWeight: '600',
  },
  menuArrow: {
    fontSize: 20,
    color: colors.slate,
  },
  logoutBtn: {
    margin: spacing.lg,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 15,
  },
});
