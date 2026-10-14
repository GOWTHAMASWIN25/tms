import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, statusColor } from '../theme';

export function Button({ title, onPress, secondary = false, loading = false, disabled = false, style }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        (disabled || loading) && styles.disabledButton,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.primary : '#FFFFFF'} />
      ) : (
        <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field({ label, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#9BA5B5"
        style={styles.input}
        {...inputProps}
      />
    </View>
  );
}

export function SectionTitle({ title, action, onAction }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {action ? <Pressable onPress={onAction}><Text style={styles.action}>{action}</Text></Pressable> : null}
    </View>
  );
}

export function StatusPill({ status }) {
  const tone = statusColor(status);
  return (
    <View style={[styles.pill, { backgroundColor: `${tone}16` }]}>
      <Text style={[styles.pillText, { color: tone }]}>{status || 'Pending'}</Text>
    </View>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return <Text accessibilityRole="alert" style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    minHeight: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryButton: { backgroundColor: colors.primaryLight },
  disabledButton: { opacity: 0.55 },
  pressed: { opacity: 0.82 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryButtonText: { color: colors.primary },
  field: { gap: 8, marginBottom: 17 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    color: colors.ink,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionHeading: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  action: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  pill: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 30, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '700' },
  error: {
    color: colors.danger,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    fontSize: 14,
  },
});
