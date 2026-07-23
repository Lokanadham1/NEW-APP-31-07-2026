import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import PrimaryButton from '../components/PrimaryButton';
import { useCart } from '../context/CartContext';

export default function LoginScreen({ navigation }) {
  const { setUser } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const canContinue = name.trim().length > 1 && phone.trim().length >= 10;

  const handleContinue = () => {
    setUser({ name: name.trim(), phone: phone.trim() });
    navigation.replace('MainTabs');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>Welcome to Roti & More</Text>
        <Text style={styles.subtitle}>Enter your details to start ordering</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Your name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Aarav Sharma"
            placeholderTextColor={colors.slate}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Mobile number</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor={colors.slate}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={10}
          />
        </View>

        <PrimaryButton
          title="Continue"
          onPress={handleContinue}
          disabled={!canContinue}
          style={{ width: '100%', marginTop: spacing.md }}
        />

        <Text style={styles.disclaimer}>
          By continuing, you agree to Roti & More's Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.slate,
    marginTop: 4,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
  },
  disclaimer: {
    fontSize: 11.5,
    color: colors.slate,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 16,
  },
});
