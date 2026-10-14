import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorBanner, SectionTitle, StatusPill } from '../components/UI';
import { API_BASE_URL, complaintApi, directoryApi, getErrorMessage } from '../api';
import { colors } from '../theme';

const statuses = ['Pending', 'Assigned', 'In-Progress', 'Onhold', 'Closed'];

export default function TicketsScreen({ user, refreshKey }) {
  const [tickets, setTickets] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [assigneeById, setAssigneeById] = useState({});
  const isAdmin = user?.role === 'SuperAdmin';

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [ticketsResponse, staffResponse] = await Promise.all([
        complaintApi.list(),
        isAdmin ? directoryApi.users() : Promise.resolve({ data: [] }),
      ]);
      setTickets(Array.isArray(ticketsResponse.data) ? ticketsResponse.data : []);
      setStaff(Array.isArray(staffResponse.data) ? staffResponse.data.filter((person) => person.role !== 'SuperAdmin') : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load tickets.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const updateStatus = async (ticket, status) => {
    setBusyId(ticket._id);
    try {
      await complaintApi.updateStatus(ticket._id, status);
      await load(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update ticket status.'));
    } finally {
      setBusyId('');
    }
  };

  const assign = async (ticket) => {
    const assignee = assigneeById[ticket._id];
    if (!assignee) {
      Alert.alert('Choose a staff member', 'Select a staff member before assigning this ticket.');
      return;
    }
    setBusyId(ticket._id);
    try {
      await complaintApi.assign(ticket._id, assignee);
      await load(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not assign ticket.'));
    } finally {
      setBusyId('');
    }
  };

  const openAttachment = async (path) => {
    const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
    const attachmentUrl = new URL(path, `${baseUrl}/`).toString();
    try {
      await Linking.openURL(attachmentUrl);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not open this attachment.'));
    }
  };

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
    >
      <Text style={styles.eyebrow}>{isAdmin ? 'SERVICE OVERVIEW' : 'YOUR SERVICE'}</Text>
      <Text style={styles.title}>{isAdmin ? 'All tickets' : 'My tickets'}</Text>
      <Text style={styles.subtitle}>{tickets.length} {tickets.length === 1 ? 'request' : 'requests'} in your queue</Text>
      <ErrorBanner message={error} />
      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      ) : tickets.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyIcon}>◷</Text><Text style={styles.emptyTitle}>Nothing here yet</Text><Text style={styles.emptyCopy}>Your service requests will show up here.</Text></View>
      ) : tickets.map((ticket) => {
        const currentUserId = String(user?.id || user?._id);
        const isAssignee = String(ticket.assignedTo?._id || ticket.assignedTo) === currentUserId;
        const isCreator = String(ticket.createdBy?._id || ticket.createdBy) === currentUserId;
        const allowedStatuses = isAdmin
          ? statuses
          : isAssignee
            ? ['In-Progress', 'Onhold', 'Closed']
            : isCreator
              ? ['Pending', 'Closed']
              : [];
        return (
          <View key={ticket._id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.categoryIcon}><Text style={styles.categoryIconText}>⌂</Text></View>
              <StatusPill status={ticket.status} />
            </View>
            <Text style={styles.category}>{ticket.complaintType}</Text>
            <Text style={styles.location}>{ticket.blockName} · {ticket.roomNumber}</Text>
            {!!ticket.remarks && <Text style={styles.description} numberOfLines={3}>{ticket.remarks}</Text>}
            {ticket.attachment ? (
              <Pressable onPress={() => openAttachment(ticket.attachment)} style={styles.attachment}>
                <Text style={styles.attachmentText}>↗  Open attachment</Text>
              </Pressable>
            ) : null}
            <View style={styles.meta}><Text style={styles.metaText}>{new Date(ticket.createdAt).toLocaleDateString()}</Text><Text style={styles.metaText}>ID · {(ticket._id || '').slice(-6).toUpperCase()}</Text></View>
            {isAdmin && (
              <View style={styles.manage}>
                <Text style={styles.manageLabel}>Assign to staff</Text>
                <View style={styles.pickerWrap}>
                  <Picker selectedValue={assigneeById[ticket._id] || ''} onValueChange={(value) => setAssigneeById((current) => ({ ...current, [ticket._id]: value }))} style={styles.picker}>
                    <Picker.Item label="Select staff member" value="" />
                    {staff.map((person) => <Picker.Item key={person._id} label={`${person.username} · ${person.role}`} value={person._id} />)}
                  </Picker>
                </View>
                <Button title="Assign ticket" secondary onPress={() => assign(ticket)} loading={busyId === ticket._id} />
              </View>
            )}
            {allowedStatuses.length > 0 && (
              <View style={styles.manage}>
                <SectionTitle title="Update status" />
                <View style={styles.statusOptions}>
                  {allowedStatuses.filter((status) => status !== ticket.status).map((status) => (
                    <Pressable key={status} disabled={busyId === ticket._id} onPress={() => updateStatus(ticket, status)} style={styles.statusButton}>
                      <Text style={styles.statusButtonText}>{status === 'Closed' ? 'Resolve' : status}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 21, paddingTop: 23, paddingBottom: 35 },
  eyebrow: { color: colors.primary, letterSpacing: 1.5, fontSize: 11, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', marginTop: 6 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 6, marginBottom: 22 },
  loader: { marginTop: 50 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30, backgroundColor: colors.surface, borderRadius: 20 },
  emptyIcon: { color: colors.primary, fontSize: 32, marginBottom: 12 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  emptyCopy: { color: colors.muted, textAlign: 'center', marginTop: 7, lineHeight: 20 },
  card: { backgroundColor: colors.surface, borderRadius: 19, padding: 16, marginBottom: 13, borderWidth: 1, borderColor: colors.line },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  categoryIconText: { color: colors.primary, fontSize: 23 },
  category: { color: colors.ink, fontSize: 17, fontWeight: '700', marginTop: 14 },
  location: { color: colors.muted, fontSize: 14, marginTop: 5 },
  description: { color: colors.ink, fontSize: 13, lineHeight: 19, marginTop: 12 },
  attachment: { alignSelf: 'flex-start', marginTop: 11, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.primaryLight },
  attachmentText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  meta: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.line, marginTop: 15, paddingTop: 12 },
  metaText: { color: colors.muted, fontSize: 11 },
  manage: { borderTopWidth: 1, borderTopColor: colors.line, marginTop: 15, paddingTop: 14 },
  manageLabel: { color: colors.ink, fontWeight: '600', marginBottom: 8 },
  pickerWrap: { borderColor: colors.line, borderWidth: 1, borderRadius: 13, overflow: 'hidden', marginBottom: 10 },
  picker: { height: 50, color: colors.ink },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusButton: { paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.primaryLight, borderRadius: 12 },
  statusButtonText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
});
