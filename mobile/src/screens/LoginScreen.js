import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorBanner, Field } from '../components/UI';
import { colors } from '../theme';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>G</Text></View>
          <Text style={styles.eyebrow}>GOEXPO SERVICE DESK</Text>
          <Text style={styles.title}>Welcome{'\n'}back.</Text>
          <Text style={styles.subtitle}>Sign in to raise a request or track your service tickets.</Text>
          <View style={styles.form}>
            <ErrorBanner message={error} />
            <Field
              label="Email address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
            />
            <Button title="Sign in" onPress={submit} loading={loading} />
          </View>
          <Text style={styles.footer}>A simpler way to keep things moving.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 26, paddingVertical: 36 },
  brandMark: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  brandMarkText: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 14 },
  title: { color: colors.ink, fontSize: 46, lineHeight: 51, fontWeight: '800', letterSpacing: -1.5 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 14, maxWidth: 330 },
  form: { marginTop: 34 },
  footer: { marginTop: 32, color: colors.muted, fontSize: 13, textAlign: 'center' },
});
