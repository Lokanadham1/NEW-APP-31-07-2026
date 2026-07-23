import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const t = setTimeout(() => {
      navigation.replace('Login');
    }, 1400);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} />
      <Text style={styles.brand}>Roti & More</Text>
      <Text style={styles.tagline}>Home-style meals, made fresh</Text>
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
