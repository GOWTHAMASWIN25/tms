import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Button, ErrorBanner, Field, SectionTitle, StatusPill } from '../components/UI';
import { getErrorMessage, masterApi } from '../api';
import { colors } from '../theme';

const resourceDefinitions = {
  departments: {
    title: 'Departments',
    fields: [
      { key: 'name', label: 'Department name', required: true },
      { key: 'shortName', label: 'Short name (2-8 characters)', required: true },
      { key: 'description', label: 'Description', multiline: true },
    ],
  },
  programmes: {
    title: 'Programmes',
    fields: [
      { key: 'name', label: 'Programme name', required: true },
      { key: 'shortName', label: 'Short name (2-8 characters)', required: true },
      { key: 'department', label: 'Department', required: true, options: 'departments' },
      { key: 'description', label: 'Description', multiline: true },
    ],
  },
  blocks: {
    title: 'Blocks',
    fields: [
      { key: 'name', label: 'Block name', required: true },
      { key: 'department', label: 'Department', required: true, options: 'departments' },
      { key: 'programme', label: 'Programme', required: true, options: 'programmes' },
      { key: 'description', label: 'Description', multiline: true },
    ],
  },
  rooms: {
    title: 'Rooms',
    fields: [
      { key: 'roomNumber', label: 'Room number', required: true },
      { key: 'department', label: 'Department', required: true, options: 'departments' },
      { key: 'programme', label: 'Programme', required: true, options: 'programmes' },
      { key: 'block', label: 'Block', required: true, options: 'blocks' },
      { key: 'floor', label: 'Floor', keyboardType: 'numeric' },
      { key: 'capacity', label: 'Capacity', keyboardType: 'numeric' },
      { key: 'description', label: 'Description', multiline: true },
    ],
  },
  roles: {
    title: 'Roles',
    fields: [
      { key: 'name', label: 'Role name', required: true },
      { key: 'description', label: 'Description', multiline: true },
      { key: 'permissions', label: 'Permissions (comma separated)', multiline: true },
    ],
  },
  users: {
    title: 'Users',
    fields: [
      { key: 'username', label: 'Username', required: true },
      { key: 'email', label: 'Email', required: true, keyboardType: 'email-address' },
      { key: 'phone', label: 'Phone', required: true, keyboardType: 'phone-pad' },
      { key: 'password', label: 'Password (leave blank when editing)', secureTextEntry: true },
      {
        key: 'role',
        label: 'Role',
        required: true,
        choices: ['SuperAdmin', 'User', 'Networking Staff', 'Plumber', 'Electrician', 'Software Developer', 'Application', 'PC Hardware'],
      },
      { key: 'department', label: 'Department (optional)', options: 'departments' },
      { key: 'programme', label: 'Programme (optional)', options: 'programmes' },
    ],
  },
};

const reportStatuses = ['Pending', 'Assigned', 'In-Progress', 'Onhold', 'Closed'];
const reportCategories = ['PC Hardware', 'PC Software', 'Application Issues', 'Network', 'Electronics', 'Plumbing', 'Other'];
const resources = Object.keys(resourceDefinitions);
const emptyFilters = { department: '', programme: '', complaintType: '', status: '', assignee: '' };
const unwrapList = (data) => Array.isArray(data) ? data : (data?.data || []);

const idOf = (value) => {
  if (value && typeof value === 'object') return String(value._id || '');
  return value ? String(value) : '';
};

const labelOf = (item) => item?.username || item?.name || item?.roomNumber || item?.shortName || item?._id || '';

function initialValues(resource) {
  return Object.fromEntries(resourceDefinitions[resource].fields.map(({ key }) => [key, '']));
}

function itemValues(resource, item) {
  const values = initialValues(resource);
  for (const field of resourceDefinitions[resource].fields) {
    const value = item[field.key];
    if (field.key === 'permissions') values[field.key] = Array.isArray(value) ? value.join(', ') : '';
    else if (field.options) values[field.key] = idOf(value);
    else values[field.key] = value == null ? '' : String(value);
  }
  return values;
}

function displayValue(resource, item) {
  const preferred = resource === 'rooms' ? ['roomNumber', 'block', 'floor'] : ['name', 'shortName', 'username', 'email'];
  const value = preferred.map((key) => {
    const itemValue = item[key];
    if (itemValue && typeof itemValue === 'object') return labelOf(itemValue);
    return itemValue;
  }).filter(Boolean).join(' · ');
  return value || 'Untitled';
}

export default function AdminScreen({ user }) {
  const [view, setView] = useState('menu');
  const [resource, setResource] = useState('departments');
  const [items, setItems] = useState([]);
  const [options, setOptions] = useState({});
  const [formValues, setFormValues] = useState(initialValues('departments'));
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [reportResults, setReportResults] = useState([]);
  const [exporting, setExporting] = useState(false);

  const isAdmin = user?.role === 'SuperAdmin';
  const definition = resourceDefinitions[resource];
  const activeResources = useMemo(() => resources.map((key) => ({
    key,
    title: resourceDefinitions[key].title,
    icon: ({ departments: '⌂', programmes: '▦', blocks: '▤', rooms: '◫', roles: '◇', users: '●' })[key],
  })), []);

  const loadResource = useCallback(async (key, pull = false) => {
    setError('');
    if (pull) setRefreshing(true);
    else setLoading(true);
    const dependencies = [...new Set(resourceDefinitions[key].fields.map((field) => field.options).filter(Boolean))];
    try {
      const [listResponse, ...optionResponses] = await Promise.all([
        masterApi.list(key),
        ...dependencies.map((dependency) => masterApi.list(dependency)),
      ]);
      setItems(unwrapList(listResponse.data));
      setOptions(Object.fromEntries(dependencies.map((dependency, index) => [
        dependency,
        unwrapList(optionResponses[index].data),
      ])));
    } catch (err) {
      setError(getErrorMessage(err, `Could not load ${resourceDefinitions[key].title.toLowerCase()}.`));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && view === 'resource') loadResource(resource);
  }, [isAdmin, loadResource, resource, view]);

  useEffect(() => {
    if (!isAdmin || view !== 'reports') return undefined;
    let active = true;
    setError('');
    Promise.all([
      masterApi.list('departments'),
      masterApi.list('programmes'),
      masterApi.list('users'),
    ]).then(([departmentResponse, programmeResponse, userResponse]) => {
      if (!active) return;
      setOptions({
        departments: unwrapList(departmentResponse.data),
        programmes: unwrapList(programmeResponse.data),
        users: unwrapList(userResponse.data),
      });
    }).catch((err) => {
      if (active) setError(getErrorMessage(err, 'Could not load report filters.'));
    });
    return () => { active = false; };
  }, [isAdmin, view]);

  const openResource = (key) => {
    setResource(key);
    setFormValues(initialValues(key));
    setEditingId('');
    setError('');
    setView('resource');
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setFormValues(itemValues(resource, item));
    setError('');
  };

  const closeEditor = () => {
    setEditingId('');
    setFormValues(initialValues(resource));
    setError('');
    setView('resource');
  };

  const saveItem = async () => {
    setError('');
    const missingField = definition.fields.find((field) => field.required && !String(formValues[field.key] || '').trim());
    if (missingField) {
      setError(`${missingField.label} is required.`);
      return;
    }
    const shortName = formValues.shortName?.trim();
    if (['departments', 'programmes'].includes(resource) && (shortName.length < 2 || shortName.length > 8)) {
      setError('Short name must be between 2 and 8 characters.');
      return;
    }
    if (resource === 'users' && !editingId && !formValues.password) {
      setError('Password is required when creating a user.');
      return;
    }

    const data = { ...formValues };
    for (const field of definition.fields) {
      if (field.options && !data[field.key]) delete data[field.key];
      if (field.keyboardType === 'numeric' && data[field.key] !== '') data[field.key] = Number(data[field.key]);
    }
    if (resource === 'roles') {
      data.permissions = (data.permissions || '').split(',').map((permission) => permission.trim()).filter(Boolean);
    }
    if (resource === 'users' && editingId && !data.password) delete data.password;

    setSaving(true);
    try {
      if (editingId) await masterApi.update(resource, editingId, data);
      else await masterApi.create(resource, data);
      closeEditor();
      setView('resource');
      await loadResource(resource, true);
    } catch (err) {
      setError(getErrorMessage(err, `Could not save ${resourceDefinitions[resource].title.toLowerCase().slice(0, -1)}.`));
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = (item) => {
    Alert.alert('Delete item?', `Delete ${displayValue(resource, item)}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setError('');
          try {
            await masterApi.remove(resource, item._id);
            await loadResource(resource, true);
          } catch (err) {
            setError(getErrorMessage(err, 'Could not delete this item.'));
          }
        },
      },
    ]);
  };

  const generateReport = async () => {
    setError('');
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    try {
      const response = await masterApi.report(params);
      setReportResults(unwrapList(response.data));
    } catch (err) {
      setError(getErrorMessage(err, 'Could not generate the report.'));
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    if (reportResults.length === 0) return;
    setError('');
    setExporting(true);
    try {
      const headers = ['Date', 'Block', 'Room', 'Type', 'Remarks', 'Status', 'CreatedBy', 'Assignee'];
      const escapeCell = (value) => {
        const normalized = String(value ?? '').replace(/\r?\n/g, ' ');
        const safeValue = /^[\s]*[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
        return `"${safeValue.replace(/"/g, '""')}"`;
      };
      const rows = reportResults.map((ticket) => [
        new Date(ticket.createdAt).toLocaleString(),
        ticket.blockName,
        ticket.roomNumber,
        ticket.complaintType,
        ticket.remarks,
        ticket.status,
        ticket.createdBy?.username || ticket.createdBy?.email || '',
        ticket.assignedTo?.username || ticket.assignedTo?.email || '',
      ]);
      const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
      const fileUri = `${FileSystem.cacheDirectory}goexpo-complaints-report.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv);
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Sharing is not available on this device.');
      }
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Share complaints report',
        UTI: 'public.comma-separated-values-text',
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not export the report.'));
    } finally {
      setExporting(false);
    }
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.page} edges={['top']}>
        <View style={styles.content}><Text style={styles.title}>Admin tools</Text><ErrorBanner message="Only SuperAdmin can access mobile management tools." /></View>
      </SafeAreaView>
    );
  }

  if (view === 'menu') {
    return (
      <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>GOEXPO CONTROL</Text>
        <Text style={styles.title}>Management</Text>
        <Text style={styles.subtitle}>Manage service data and review activity.</Text>
        <SectionTitle title="Master data" />
        {activeResources.map((entry) => (
          <Pressable key={entry.key} onPress={() => openResource(entry.key)} style={styles.menuCard}>
            <View style={styles.menuIcon}><Text style={styles.menuIconText}>{entry.icon}</Text></View>
            <Text style={styles.menuTitle}>{entry.title}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => { setError(''); setView('reports'); }} style={[styles.menuCard, styles.reportCard]}>
          <View style={[styles.menuIcon, styles.reportIcon]}><Text style={[styles.menuIconText, styles.reportIconText]}>▥</Text></View>
          <Text style={styles.menuTitle}>Complaint reports</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'reports') {
    return (
      <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        <Pressable onPress={() => setView('menu')} style={styles.back}><Text style={styles.backText}>‹  Management</Text></Pressable>
        <Text style={styles.eyebrow}>ANALYTICS</Text>
        <Text style={styles.title}>Complaint reports</Text>
        <Text style={styles.subtitle}>Filter the dataset to review matching requests.</Text>
        <ErrorBanner message={error} />
        <View style={styles.formCard}>
          <SelectField label="Department" value={filters.department} onChange={(value) => setFilters((current) => ({ ...current, department: value }))} options={itemsFrom(options.departments)} />
          <ReportOptionPicker label="Programme" value={filters.programme} onChange={(value) => setFilters((current) => ({ ...current, programme: value }))} options={itemsFrom(options.programmes)} placeholder="All programmes" />
          <ReportOptionPicker label="Status" value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} options={reportStatuses.map((value) => ({ label: value, value }))} placeholder="All statuses" />
          <ReportOptionPicker label="Category" value={filters.complaintType} onChange={(value) => setFilters((current) => ({ ...current, complaintType: value }))} options={reportCategories.map((value) => ({ label: value, value }))} placeholder="All categories" />
          <ReportOptionPicker label="Assignee" value={filters.assignee} onChange={(value) => setFilters((current) => ({ ...current, assignee: value }))} options={itemsFrom(options.users)} placeholder="Any staff member" />
          <Button title="Generate report" onPress={generateReport} loading={loading} />
        </View>
        <SectionTitle title={`Results · ${reportResults.length}`} />
        {reportResults.length > 0 ? (
          <Button title="Export / share CSV" secondary onPress={exportReport} loading={exporting} style={styles.exportButton} />
        ) : null}
        {reportResults.map((ticket) => (
          <View key={ticket._id} style={styles.record}>
            <View style={styles.recordTop}><Text style={styles.recordTitle}>{ticket.complaintType}</Text><StatusPill status={ticket.status} /></View>
            <Text style={styles.recordDetail}>{ticket.blockName} · {ticket.roomNumber}</Text>
            <Text style={styles.recordMeta}>{ticket.createdBy?.username || 'User'} · {new Date(ticket.createdAt).toLocaleDateString()}</Text>
            {ticket.assignedTo?.username ? <Text style={styles.recordMeta}>Assigned to {ticket.assignedTo.username}</Text> : null}
          </View>
        ))}
        {reportResults.length === 0 && <Text style={styles.emptyText}>Generate a report to see matching requests.</Text>}
      </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadResource(resource, true)} tintColor={colors.primary} />}
    >
      <Pressable onPress={() => { setView('menu'); closeEditor(); }} style={styles.back}><Text style={styles.backText}>‹  Management</Text></Pressable>
      <Text style={styles.eyebrow}>MASTER DATA</Text>
      <Text style={styles.title}>{definition.title}</Text>
      <Text style={styles.subtitle}>{items.length} {items.length === 1 ? 'record' : 'records'}</Text>
      <ErrorBanner message={error} />
      {editingId || view === 'create' ? (
        <View style={styles.formCard}>
          <SectionTitle title={editingId ? `Edit ${definition.title.slice(0, -1)}` : `New ${definition.title.slice(0, -1)}`} action="Cancel" onAction={closeEditor} />
          {definition.fields.map((field) => {
            if (field.choices) {
              return (
                <ReportOptionPicker
                  key={field.key}
                  label={field.label}
                  value={formValues[field.key]}
                  onChange={(value) => setFormValues((current) => ({ ...current, [field.key]: value }))}
                  options={field.choices.map((value) => ({ label: value, value }))}
                />
              );
            }
            if (field.options) {
              return (
                <SelectField
                  key={field.key}
                  label={field.label}
                  value={formValues[field.key]}
                  onChange={(value) => setFormValues((current) => ({ ...current, [field.key]: value }))}
                  options={itemsFrom(options[field.options])}
                  optional={!field.required}
                />
              );
            }
            return (
              <Field
                key={field.key}
                label={field.key === 'password' && editingId ? 'Password (leave blank to keep current)' : field.label}
                value={formValues[field.key]}
                onChangeText={(value) => setFormValues((current) => ({ ...current, [field.key]: value }))}
                placeholder={field.key === 'shortName' ? '2-8 characters' : ''}
                keyboardType={field.keyboardType}
                secureTextEntry={field.secureTextEntry}
                autoCapitalize={field.keyboardType === 'email-address' ? 'none' : undefined}
                multiline={field.multiline}
                textAlignVertical={field.multiline ? 'top' : 'center'}
                style={field.multiline ? styles.multiline : undefined}
              />
            );
          })}
          <Button title={editingId ? 'Save changes' : 'Create record'} onPress={saveItem} loading={saving} />
        </View>
      ) : (
        <>
          <Button title={`＋  Add ${definition.title.slice(0, -1)}`} onPress={() => { setFormValues(initialValues(resource)); setEditingId(''); setView('create'); }} style={styles.addButton} />
          {loading ? <ActivityIndicator color={colors.primary} size="large" style={styles.loader} /> : items.length === 0 ? (
            <Text style={styles.emptyText}>No records found.</Text>
          ) : items.map((item) => (
            <View key={item._id} style={styles.record}>
              <Text style={styles.recordTitle}>{displayValue(resource, item)}</Text>
              <Text style={styles.recordDetail}>{item.description || item.email || item.department?.name || item.programme?.name || item.role || item.permissions?.join(', ') || ' '}</Text>
              {resource === 'users' && item.phone ? <Text style={styles.recordMeta}>{item.phone} · {item.role}</Text> : null}
              <View style={styles.recordActions}>
                <Pressable onPress={() => startEdit(item)} style={styles.editAction}><Text style={styles.editText}>Edit</Text></Pressable>
                <Pressable onPress={() => deleteItem(item)} style={styles.deleteAction}><Text style={styles.deleteText}>Delete</Text></Pressable>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

function itemsFrom(items) {
  return (items || []).map((item) => ({ label: labelOf(item), value: String(item._id) }));
}

function SelectField({ label, value, onChange, options, optional = false }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={value || ''} onValueChange={onChange} style={styles.picker}>
          <Picker.Item label={optional ? 'Not assigned' : 'Select an option'} value="" />
          {options.map((option) => <Picker.Item key={option.value} label={option.label} value={option.value} />)}
        </Picker>
      </View>
    </View>
  );
}

function ReportOptionPicker({ label, value, onChange, options, placeholder = 'Select an option' }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={value || ''} onValueChange={onChange} style={styles.picker}>
          <Picker.Item label={placeholder} value="" />
          {options.map((option) => <Picker.Item key={option.value} label={option.label} value={option.value} />)}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 21, paddingTop: 20, paddingBottom: 36 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginTop: 8 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', marginTop: 6 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: 20 },
  back: { alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 12 },
  backText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  menuCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10, borderRadius: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  reportCard: { marginTop: 10 },
  menuIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  menuIconText: { color: colors.primary, fontSize: 22 },
  reportIcon: { backgroundColor: '#F0EBFC' },
  reportIconText: { color: colors.purple },
  menuTitle: { color: colors.ink, fontSize: 15, fontWeight: '700', flex: 1, marginLeft: 13 },
  chevron: { color: colors.muted, fontSize: 25, marginHorizontal: 4 },
  addButton: { marginBottom: 17 },
  exportButton: { marginBottom: 13 },
  formCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 15, marginBottom: 20 },
  field: { marginBottom: 16 },
  fieldLabel: { color: colors.ink, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  pickerWrap: { borderWidth: 1, borderColor: colors.line, borderRadius: 13, overflow: 'hidden' },
  picker: { height: 52, color: colors.ink },
  multiline: { minHeight: 95, paddingTop: 13 },
  record: { padding: 15, marginBottom: 11, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  recordTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recordTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  recordDetail: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
  recordMeta: { color: colors.muted, fontSize: 12, marginTop: 5 },
  recordActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  editAction: { backgroundColor: colors.primaryLight, borderRadius: 11, paddingVertical: 9, paddingHorizontal: 16 },
  editText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  deleteAction: { backgroundColor: '#FFF0F0', borderRadius: 11, paddingVertical: 9, paddingHorizontal: 16 },
  deleteText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  loader: { marginTop: 45 },
  emptyText: { color: colors.muted, textAlign: 'center', paddingVertical: 35 },
});
