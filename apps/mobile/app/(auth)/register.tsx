import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { apiClient } from '../../src/lib/api';

export default function RegisterScreen() {
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', workspaceName: '' });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    const { name, email, password, workspaceName } = form;
    if (!name || !email || !password || !workspaceName)
      return Alert.alert('Error', 'Please fill in all fields');
    setLoading(true);
    try {
      await apiClient.post('/auth/register', { name, email, password, workspaceName });
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <Text style={styles.logoText}>B</Text>
        </View>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Start managing your social media</Text>

        <View style={styles.form}>
          {[
            { key: 'name', placeholder: 'Full name', autoCapitalize: 'words' as const },
            { key: 'email', placeholder: 'Email', keyboardType: 'email-address' as const, autoCapitalize: 'none' as const },
            { key: 'password', placeholder: 'Password', secure: true },
            { key: 'workspaceName', placeholder: 'Workspace / Company name', autoCapitalize: 'words' as const },
          ].map((field) => (
            <TextInput
              key={field.key}
              style={styles.input}
              placeholder={field.placeholder}
              value={form[field.key as keyof typeof form]}
              onChangeText={set(field.key as keyof typeof form)}
              autoCapitalize={field.autoCapitalize ?? 'none'}
              keyboardType={field.keyboardType ?? 'default'}
              secureTextEntry={(field as any).secure ?? false}
              placeholderTextColor="#94a3b8"
            />
          ))}

          <TouchableOpacity
            style={[styles.button, (loading || isLoading) && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading || isLoading}
          >
            {loading || isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Create account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.linkRow}>
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkHighlight}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, backgroundColor: '#f8fafc',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  logo: {
    width: 64, height: 64, borderRadius: 16, marginBottom: 24,
    backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  title: { fontSize: 26, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 32 },
  form: { width: '100%', gap: 12 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 14, fontSize: 15, color: '#0f172a',
  },
  button: {
    backgroundColor: '#8b5cf6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4,
  },
  buttonDisabled: { backgroundColor: '#c4b5fd' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkRow: { alignItems: 'center', marginTop: 8 },
  linkText: { fontSize: 14, color: '#64748b' },
  linkHighlight: { color: '#8b5cf6', fontWeight: '600' },
});
