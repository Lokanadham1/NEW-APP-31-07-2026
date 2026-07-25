import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useNotificationsBadge } from '../context/NotificationsContext';
import { useAdminPhone } from '../context/AdminPhoneContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotificationsBadge();
  const { adminPhone, callAdmin } = useAdminPhone();

  const handleLogout = async () => {
    await logout();
    navigation.getParent()?.getParent()?.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      adminPhone
        ? `Questions about an order, delivery, or billing? Call us at ${adminPhone}.`
        : "The admin's contact number isn't configured yet.",
      adminPhone ? [{ text: 'Call now', onPress: callAdmin }, { text: 'Close', style: 'cancel' }] : undefined
    );
  };

  const MENU_ROWS = [
    { icon: 'create-outline', label: 'Edit profile', onPress: () => navigation.navigate('ProfileSetup', { isEdit: true }) },
    { icon: 'help-circle-outline', label: 'Help & support', onPress: handleHelp },
    { icon: 'document-text-outline', label: 'Terms & Privacy Policy', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <Pressable onPress={callAdmin} style={styles.alertsBtn} hitSlop={10}>
            <Ionicons name="call-outline" size={17} color={colors.primaryDark} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.alertsBtn} hitSlop={10}>
            <Ionicons name="notifications-outline" size={18} color={colors.primaryDark} />
            {unreadCount > 0 ? (
              <View style={styles.alertsBadge}>
                <Text style={styles.alertsBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
        <Image source={require('../../assets/logo.png')} style={styles.avatar} />
        <Text style={styles.name}>{user?.cateringName || user?.name || 'Guest'}</Text>
        <Text style={styles.phone}>{user?.mobile}</Text>
        {user?.customerId ? (
          <View style={styles.customerIdBadge}>
            <Text style={styles.customerIdText}>{user.customerId}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.menu}>
        {MENU_ROWS.map((row) => (
          <Pressable key={row.label} style={styles.menuRow} onPress={row.onPress}>
            <Ionicons name={row.icon} size={19} color={colors.ink} style={styles.menuIcon} />
            <Text style={styles.menuLabel}>{row.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.slate} />
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </SafeAreaView>
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
    position: 'relative',
  },
  headerActions: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  alertsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertsBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertsBadgeText: {
    color: '#fff',
    fontSize: 9.5,
    fontWeight: '800',
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
  customerIdBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  customerIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
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
    marginRight: spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14.5,
    color: colors.ink,
    fontWeight: '600',
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
