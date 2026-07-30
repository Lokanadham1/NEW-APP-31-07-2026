import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../theme/colors';
import { useNotificationsBadge } from '../context/NotificationsContext';
import { useAdminPhone } from '../context/AdminPhoneContext';

// showAlerts: set false on the Alerts screens themselves (no point showing a
// bell that reopens the screen you're already on) and on pre-login/onboarding
// screens. alertsScreen: which inbox to open — admin screens pass
// "AdminNotifications", everything else uses the customer one; that same
// value also decides the Call button's default visibility, since calling
// the admin only makes sense on the customer side (override with showCall
// if a screen ever needs to differ).
export default function Header({
  title, subtitle, onBack, right,
  showAlerts = true, alertsScreen = 'Notifications',
  showCall = alertsScreen !== 'AdminNotifications',
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { unreadCount } = useNotificationsBadge();
  const { callAdmin } = useAdminPhone();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>
        ) : (
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.rightCluster}>
        {right ? <View>{right}</View> : null}
        {showCall ? (
          <Pressable onPress={callAdmin} style={styles.iconBtn} hitSlop={10}>
            <Ionicons name="call-outline" size={17} color={colors.primaryDark} />
          </Pressable>
        ) : null}
        {showAlerts ? (
          <Pressable
            onPress={() => navigation.navigate(alertsScreen)}
            style={styles.iconBtn}
            hitSlop={10}
          >
            <Ionicons name="notifications-outline" size={18} color={colors.primaryDark} />
            {unreadCount > 0 ? (
              <View style={styles.alertsBadge}>
                <Text style={styles.alertsBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.cream,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    marginRight: spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.slate,
    marginTop: 1,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
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
});
