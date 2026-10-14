import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorBanner, SectionTitle, StatusPill } from '../components/UI';
import { colors } from '../theme';

const shortcuts = [
  { icon: '＋', title: 'Raise a ticket', detail: 'Tell us what needs fixing', screen: 'Raise' },
  { icon: '◷', title: 'Track requests', detail: 'See updates on your tickets', screen: 'Tickets' },
];

export default function HomeScreen({ user, stats, recent, onNavigate, onRefresh, overviewError }) {
  const name = user?.username || user?.name || 'there';
  return (
    <SafeAreaView style={styles.page} edges={['top']}>
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>GOOD DAY</Text>
          <Text style={styles.name}>{name}</Text>
        </View>
        <Pressable onPress={onRefresh} style={styles.avatar}><Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text></Pressable>
      </View>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>GOEXPO SUPPORT</Text>
        <Text style={styles.heroTitle}>How can we{'\n'}help today?</Text>
        <Text style={styles.heroBody}>Raise an issue and our team will get it moving.</Text>
        <Button title="Create a request  →" onPress={() => onNavigate('Raise')} style={styles.heroButton} />
        <View style={styles.heroOrb} />
      </View>
      <ErrorBanner message={overviewError} />
      <SectionTitle title="Your requests" action="See all" onAction={() => onNavigate('Tickets')} />
      <View style={styles.statsRow}>
        <Stat value={stats?.total ?? 0} label="Total" color={colors.ink} />
        <Stat value={stats?.pending ?? 0} label="Pending" color={colors.warning} />
        <Stat value={stats?.assigned ?? 0} label="Assigned" color={colors.blue} />
        <Stat value={stats?.closed ?? 0} label="Resolved" color={colors.primary} />
      </View>
      <SectionTitle title="Quick access" />
      {shortcuts.map((item) => (
        <Pressable key={item.title} onPress={() => onNavigate(item.screen)} style={styles.shortcut}>
          <View style={styles.shortcutIcon}><Text style={styles.shortcutIconText}>{item.icon}</Text></View>
          <View style={styles.shortcutCopy}><Text style={styles.shortcutTitle}>{item.title}</Text><Text style={styles.shortcutDetail}>{item.detail}</Text></View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
      {recent?.length > 0 && (
        <View style={styles.recentSection}>
          <SectionTitle title="Recent activity" action="See all" onAction={() => onNavigate('Tickets')} />
          {recent.slice(0, 2).map((item) => (
            <View key={item._id} style={styles.recentCard}>
              <View style={styles.recentTop}><Text style={styles.recentCategory}>{item.complaintType}</Text><StatusPill status={item.status} /></View>
              <Text style={styles.recentLocation}>{item.blockName} · {item.roomNumber}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label, color }) {
  return <View style={styles.stat}><Text style={[styles.statValue, { color }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 21, paddingTop: 18, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  greeting: { color: colors.muted, letterSpacing: 1.5, fontSize: 11, fontWeight: '700' },
  name: { marginTop: 4, color: colors.ink, fontSize: 24, fontWeight: '800' },
  avatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  hero: { backgroundColor: colors.primary, borderRadius: 24, padding: 24, overflow: 'hidden', marginBottom: 28 },
  heroEyebrow: { color: '#A9DFCE', letterSpacing: 1.5, fontWeight: '700', fontSize: 11 },
  heroTitle: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', lineHeight: 36, marginTop: 13, letterSpacing: -0.5 },
  heroBody: { color: '#DBF0E9', fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 230 },
  heroButton: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', marginTop: 21 },
  statsRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 18, paddingVertical: 17, marginBottom: 27, borderWidth: 1, borderColor: colors.line },
  stat: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.line },
  statValue: { fontSize: 19, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 10, marginTop: 4 },
  shortcut: { backgroundColor: colors.surface, borderRadius: 17, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: colors.line },
  shortcutIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  shortcutIconText: { color: colors.primary, fontSize: 22, fontWeight: '600' },
  shortcutCopy: { marginLeft: 12, flex: 1 },
  shortcutTitle: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  shortcutDetail: { color: colors.muted, fontSize: 12, marginTop: 4 },
  chevron: { color: colors.muted, fontSize: 25, marginHorizontal: 5 },
  recentSection: { marginTop: 19 },
  recentCard: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, padding: 15, borderRadius: 16, marginBottom: 10 },
  recentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentCategory: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  recentLocation: { color: colors.muted, fontSize: 13, marginTop: 9 },
  heroOrb: { position: 'absolute', width: 125, height: 125, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', right: -48, top: -46 },
});
