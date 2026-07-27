import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/colors';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

// Delivery-role accounts can be added from the admin Staff screen, but there's
// no delivery-specific app experience yet (route/assigned-orders screens,
// mark-delivered from here, etc.) — that's a separate feature to build.
// This placeholder just confirms the account works and offers a way out,
// instead of a delivery login falling through to the customer ordering app.
export default function DeliveryHomeScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>You're signed in as delivery staff</Text>
        <Text style={styles.subtitle}>
          {user?.mobile} · The delivery app isn't built yet — check back soon for assigned
          deliveries and order updates.
        </Text>
        <PrimaryButton title="Log out" variant="outline" onPress={handleLogout} style={{ marginTop: spacing.xl }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  logo: { width: 72, height: 72, borderRadius: 16, marginBottom: spacing.lg },
  title: { fontSize: 19, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.slate, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
});
