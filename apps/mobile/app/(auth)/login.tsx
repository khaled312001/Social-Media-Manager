import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';

export default function LoginScreen() {
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [needs2FA, setNeeds2FA] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter email and password');
    try {
      await login(email, password, totp || undefined);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Login failed';
      if (msg.toLowerCase().includes('2fa') || msg.toLowerCase().includes('totp')) {
        setNeeds2FA(true);
      } else {
        Alert.alert('Error', msg);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>B</Text>
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to Barmagly</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {needs2FA && (
            <TextInput
              style={styles.input}
              placeholder="6-digit authenticator code"
              keyboardType="number-pad"
              maxLength={6}
              value={totp}
              onChangeText={setTotp}
            />
          )}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 24 },
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
});
