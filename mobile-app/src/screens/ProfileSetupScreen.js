import { useState } from 'react';
import {
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import Header from '../components/Header';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

// Used both for first-time setup (from Login) and later edits (from Profile).
export default function ProfileSetupScreen({ navigation, route }) {
  const { user, completeProfile } = useAuth();
  const isEdit = !!route.params?.isEdit;

  const [name, setName] = useState(user?.name || '');
  const [cateringName, setCateringName] = useState(user?.cateringName || '');
  const [address, setAddress] = useState(user?.address || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSave = name.trim().length > 1 && address.trim().length > 4;

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      await completeProfile({ name: name.trim(), cateringName: cateringName.trim(), address: address.trim() });
      if (isEdit) {
        navigation.goBack();
      } else {
        navigation.replace('MainTabs');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {isEdit ? <Header title="Edit profile" onBack={() => navigation.goBack()} /> : null}
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {!isEdit ? (
          <>
            <Text style={styles.title}>Just one more step</Text>
            <Text style={styles.subtitle}>
              Tell us who you are and where to deliver — you can update this any time.
            </Text>
          </>
        ) : null}

        <Text style={styles.label}>Your name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Ramesh"
          placeholderTextColor={colors.slate}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Catering / business name (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Ramesh Catering"
          placeholderTextColor={colors.slate}
          value={cateringName}
          onChangeText={setCateringName}
        />

        <Text style={styles.label}>Delivery address *</Text>
        <TextInput
          style={[styles.input, styles.addressInput]}
          placeholder="Flat / house no., street, area, landmark"
          placeholderTextColor={colors.slate}
          multiline
          value={address}
          onChangeText={setAddress}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          title="Save & continue"
          onPress={handleSave}
          disabled={!canSave}
          loading={loading}
          style={{ width: '100%', marginTop: spacing.lg }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: 14,
    color: colors.slate,
    marginTop: 4,
    marginBottom: spacing.lg,
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
  addressInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.md,
  },
});
