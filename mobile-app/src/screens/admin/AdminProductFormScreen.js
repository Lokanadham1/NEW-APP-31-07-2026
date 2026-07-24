import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, Image, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, radii, spacing } from '../../theme/colors';
import Header from '../../components/Header';
import PrimaryButton from '../../components/PrimaryButton';
import { api } from '../../api/client';

export default function AdminProductFormScreen({ route, navigation }) {
  const existing = route.params?.product || null;

  const [name, setName] = useState(existing?.name || '');
  const [price, setPrice] = useState(existing ? String(existing.price) : '');
  const [category, setCategory] = useState(existing?.category || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [status, setStatus] = useState(existing?.status || 'available');
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canSave = name.trim().length > 0 && Number(price) > 0;

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Photo library permission is needed to add a product photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const mime = asset.mimeType || 'image/jpeg';
      setImageUrl(`data:${mime};base64,${asset.base64}`);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const body = {
        name: name.trim(),
        price: Number(price),
        category: category.trim(),
        description: description.trim(),
        status,
        imageUrl: imageUrl || undefined,
      };
      if (existing) {
        await api.put(`/products/${existing.id}`, body);
      } else {
        await api.post('/products', body);
      }
      navigation.goBack();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.cream }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title={existing ? 'Edit product' : 'New product'} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Poli" placeholderTextColor={colors.slate} />

        <Text style={styles.label}>Price (₹)</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.slate} />

        <Text style={styles.label}>Category</Text>
        <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="e.g. Flatbreads" placeholderTextColor={colors.slate} />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Short description"
          placeholderTextColor={colors.slate}
        />

        <Text style={styles.label}>Status</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable style={[styles.chip, status === 'available' && styles.chipActive]} onPress={() => setStatus('available')}>
            <Text style={[styles.chipText, status === 'available' && styles.chipTextActive]}>Available</Text>
          </Pressable>
          <Pressable style={[styles.chip, status === 'out_of_stock' && styles.chipActive]} onPress={() => setStatus('out_of_stock')}>
            <Text style={[styles.chipText, status === 'out_of_stock' && styles.chipTextActive]}>Out of stock</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Photo</Text>
        <Pressable style={styles.imagePicker} onPress={pickImage}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
          ) : (
            <Text style={styles.imagePickerText}>Tap to choose a photo</Text>
          )}
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          title={saving ? 'Saving…' : 'Save'}
          onPress={handleSave}
          disabled={!canSave || saving}
          loading={saving}
          style={{ width: '100%', marginTop: spacing.lg }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: 6, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: 12,
    fontSize: 15, color: colors.ink,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  chip: {
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 9,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  chipTextActive: { color: '#fff' },
  imagePicker: {
    height: 120, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    borderStyle: 'dashed', backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  imagePickerText: { color: colors.slate, fontSize: 13.5 },
  imagePreview: { width: '100%', height: '100%' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', marginTop: spacing.md },
});
