import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorBanner, Field } from '../components/UI';
import { complaintApi, directoryApi, getErrorMessage } from '../api';
import { colors } from '../theme';

const categories = ['PC Hardware', 'PC Software', 'Application Issues', 'Network', 'Electronics', 'Plumbing', 'Other'];
const listFrom = (data) => Array.isArray(data) ? data : (data?.data || []);

export default function RaiseTicketScreen({ user, onSubmitted }) {
  const [departments, setDepartments] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [blockId, setBlockId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [manualRoom, setManualRoom] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [remarks, setRemarks] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loadingDirectory, setLoadingDirectory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const canRaise = !user?.role || ['SuperAdmin', 'User'].includes(user.role);

  useEffect(() => {
    let active = true;
    directoryApi.departments()
      .then((response) => { if (active) setDepartments(listFrom(response.data)); })
      .catch((err) => { if (active) setError(getErrorMessage(err, 'Could not load departments.')); })
      .finally(() => { if (active) setLoadingDirectory(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setBlocks([]);
    setBlockId('');
    setRooms([]);
    setRoomId('');
    if (!departmentId) return undefined;
    let active = true;
    setLoadingDirectory(true);
    directoryApi.blocks({ departmentId })
      .then((response) => { if (active) setBlocks(listFrom(response.data)); })
      .catch((err) => { if (active) setError(getErrorMessage(err, 'Could not load buildings.')); })
      .finally(() => { if (active) setLoadingDirectory(false); });
    return () => { active = false; };
  }, [departmentId]);

  useEffect(() => {
    setRooms([]);
    setRoomId('');
    if (!blockId) return undefined;
    let active = true;
    setLoadingDirectory(true);
    directoryApi.rooms({ blockId })
      .then((response) => { if (active) setRooms(listFrom(response.data)); })
      .catch((err) => { if (active) setError(getErrorMessage(err, 'Could not load rooms.')); })
      .finally(() => { if (active) setLoadingDirectory(false); });
    return () => { active = false; };
  }, [blockId]);

  const chooseAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled) setAttachment(result.assets[0]);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not open the document picker.'));
    }
  };

  const submit = async () => {
    setError('');
    const department = departments.find((item) => item._id === departmentId);
    const block = blocks.find((item) => item._id === blockId);
    const room = rooms.find((item) => item._id === roomId);
    const roomNumber = roomId === '__manual__' || rooms.length === 0 ? manualRoom.trim() : room?.roomNumber;
    if (!department || !block || !roomNumber) {
      setError('Select a department and building, then choose or enter a room.');
      return;
    }
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('departmentName', department.name);
      data.append('blockName', block.name);
      data.append('roomNumber', roomNumber);
      data.append('complaintType', category);
      data.append('remarks', remarks.trim());
      if (user?.id || user?._id) data.append('userId', user.id || user._id);
      if (attachment) {
        data.append('attachment', {
          uri: attachment.uri,
          name: attachment.name || 'attachment',
          type: attachment.mimeType || 'application/octet-stream',
        });
      }
      await complaintApi.create(data);
      Alert.alert('Request submitted', 'Your service request is on its way.', [
        { text: 'Done', onPress: onSubmitted },
      ]);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not submit your request.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!canRaise) {
    return <SafeAreaView style={styles.permission} edges={['top']}><Text style={styles.title}>Request not available</Text><Text style={styles.helper}>Your account role does not have permission to raise a ticket.</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>GOEXPO SUPPORT</Text>
        <Text style={styles.title}>Raise a ticket</Text>
        <Text style={styles.helper}>Share a few details and we’ll send your request to the right team.</Text>
        <ErrorBanner message={error} />
        {loadingDirectory && departments.length === 0 ? (
          <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
        ) : (
          <View style={styles.form}>
            <SelectField label="Department" value={departmentId} onChange={setDepartmentId} placeholder="Choose department" items={departments.map((item) => ({ label: item.name, value: item._id }))} />
            <SelectField label="Building / block" value={blockId} onChange={setBlockId} placeholder="Choose building" disabled={!departmentId} items={blocks.map((item) => ({ label: item.name, value: item._id }))} />
            <SelectField
              label="Room"
              value={roomId}
              onChange={setRoomId}
              placeholder="Choose room"
              disabled={!blockId}
              items={[...rooms.map((item) => ({ label: item.roomNumber, value: item._id })), { label: 'Enter a room manually', value: '__manual__' }]}
            />
            {(rooms.length === 0 || roomId === '__manual__') && (
              <Field label="Room number" value={manualRoom} onChangeText={setManualRoom} placeholder="e.g. R-101" />
            )}
            <SelectField label="Problem category" value={category} onChange={setCategory} items={categories.map((item) => ({ label: item, value: item }))} />
            <Field
              label="Describe the issue"
              value={remarks}
              onChangeText={setRemarks}
              placeholder="What happened? Add any helpful details."
              multiline
              textAlignVertical="top"
              style={styles.description}
            />
            <Text style={styles.label}>Photo or document (optional)</Text>
            <Button title={attachment?.name || 'Choose a file'} secondary onPress={chooseAttachment} style={styles.fileButton} />
            <Button title="Submit request" onPress={submit} loading={submitting} style={styles.submitButton} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SelectField({ label, value, onChange, items, placeholder, disabled = false }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.pickerWrap, disabled && styles.disabled]}>
        <Picker selectedValue={value} onValueChange={onChange} enabled={!disabled} style={styles.picker}>
          {placeholder ? <Picker.Item label={placeholder} value="" /> : null}
          {items.map((item) => <Picker.Item key={item.value} label={item.label} value={item.value} />)}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1 },
  content: { paddingHorizontal: 21, paddingTop: 23, paddingBottom: 35 },
  eyebrow: { color: colors.primary, letterSpacing: 1.5, fontSize: 11, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', marginTop: 6 },
  helper: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 22 },
  loader: { marginTop: 50 },
  form: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 19, padding: 16 },
  field: { marginBottom: 17 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  pickerWrap: { borderColor: colors.line, borderWidth: 1, borderRadius: 13, overflow: 'hidden' },
  picker: { height: 52, color: colors.ink },
  disabled: { opacity: 0.55 },
  description: { minHeight: 110, paddingTop: 14 },
  fileButton: { marginTop: 2, marginBottom: 18 },
  submitButton: { marginTop: 2 },
  permission: { flex: 1, backgroundColor: colors.background, padding: 25, justifyContent: 'center' },
});
