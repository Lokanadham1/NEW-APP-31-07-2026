import { useState, useRef } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../theme/colors';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { requestOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState('phone'); // 'phone' | 'code'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const devCodeRef = useRef(null); // dev-mode only, see note below

  const canSendCode = /^\d{10}$/.test(phone);
  const canVerify = /^\d{4}$/.test(code);

  const handleSendCode = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await requestOtp(phone);
      // Dev mode only: the backend echoes the code back so you can test
      // without a live SMS provider. Remove this once OTP_PROVIDER is set.
      devCodeRef.current = res.devCode || null;
      setStep('code');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await verifyOtp(phone, code);
      if (user.role === 'admin') {
        navigation.replace('AdminTabs');
      } else {
        navigation.replace(user.profileDone ? 'MainTabs' : 'ProfileSetup');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>Welcome to Roti & More</Text>
        <Text style={styles.subtitle}>
          {step === 'phone'
            ? "Enter your mobile number — we'll text you a code"
            : `Enter the 4-digit code sent to ${phone}`}
        </Text>

        <View style={styles.form}>
          {step === 'phone' ? (
            <>
              <Text style={styles.label}>Mobile number</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.slate}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
                maxLength={10}
                autoFocus
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Verification code</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="0000"
                placeholderTextColor={colors.slate}
                keyboardType="number-pad"
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
                maxLength={4}
                autoFocus
              />
              {devCodeRef.current ? (
                <Text style={styles.devHint}>
                  Dev mode — no SMS sent. Your code is {devCodeRef.current}.
                </Text>
              ) : null}
            </>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          title={step === 'phone' ? 'Send code' : 'Verify & continue'}
          onPress={step === 'phone' ? handleSendCode : handleVerify}
          disabled={step === 'phone' ? !canSendCode : !canVerify}
          loading={loading}
          style={{ width: '100%', marginTop: spacing.md }}
        />

        {step === 'code' ? (
          <PrimaryButton
            title="Change number"
            variant="outline"
            onPress={() => { setStep('phone'); setCode(''); setError(''); }}
            style={{ width: '100%', marginTop: spacing.sm }}
          />
        ) : null}

        <Text style={styles.disclaimer}>
          By continuing, you agree to Roti & More's Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
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
  codeInput: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
  },
  devHint: {
    fontSize: 12.5,
    color: colors.goldDark,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 11.5,
    color: colors.slate,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 16,
  },
});
