import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen({ navigation }) {
  const { bootstrapping, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (bootstrapping) return;
    if (!isAuthenticated) {
      navigation.replace('Login');
    } else if (user?.role === 'admin') {
      navigation.replace('AdminTabs');
    } else if (user?.role === 'delivery') {
      navigation.replace('DeliveryHome');
    } else if (!user?.profileDone) {
      navigation.replace('ProfileSetup');
    } else {
      navigation.replace('MainTabs');
    }
  }, [bootstrapping, isAuthenticated, user, navigation]);

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} />
      <Text style={styles.brand}>Roti & More</Text>
      <Text style={styles.tagline}>Home-style meals, made fresh</Text>
      <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.3,
  },
  tagline: {
    fontSize: 14,
    color: colors.slate,
    marginTop: 6,
  },
});
