import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { Button, ErrorBanner } from './src/components/UI';
import { authApi, complaintApi, getErrorMessage, setAuthToken } from './src/api';
import { colors } from './src/theme';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RaiseTicketScreen from './src/screens/RaiseTicketScreen';
import TicketsScreen from './src/screens/TicketsScreen';
import AdminScreen from './src/screens/AdminScreen';

const Tabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs({ user, onLogout, onRefresh, refreshKey, stats, recent, overviewError }) {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{ tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>⌂</Text> }}
      >
        {(props) => <HomeScreen {...props} user={user} stats={stats} recent={recent} onRefresh={onRefresh} onNavigate={(screen) => props.navigation.navigate(screen)} overviewError={overviewError} />}
      </Tabs.Screen>
      <Tabs.Screen
        name="Tickets"
        options={{ tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>▤</Text> }}
      >
        {(props) => <TicketsScreen {...props} user={user} refreshKey={refreshKey} />}
      </Tabs.Screen>
      <Tabs.Screen
        name="Raise"
        options={{ tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>＋</Text> }}
      >
        {(props) => <RaiseTicketScreen {...props} user={user} onSubmitted={() => { onRefresh(); props.navigation.navigate('Tickets'); }} />}
      </Tabs.Screen>
      <Tabs.Screen
        name="Account"
        options={{ tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>●</Text> }}
      >
        {() => <AccountScreen user={user} onLogout={onLogout} />}
      </Tabs.Screen>
      {user?.role === 'SuperAdmin' && (
        <Tabs.Screen
          name="Admin"
          options={{ tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>⚙</Text> }}
        >
          {() => <AdminScreen user={user} />}
        </Tabs.Screen>
      )}
    </Tabs.Navigator>
  );
}

function AccountScreen({ user, onLogout }) {
  return (
    <SafeAreaView style={styles.account} edges={['top']}>
      <View style={styles.accountAvatar}><Text style={styles.accountAvatarText}>{(user?.username || user?.name || 'G').charAt(0).toUpperCase()}</Text></View>
      <Text style={styles.accountName}>{user?.username || user?.name || 'GoExpo user'}</Text>
      <Text style={styles.accountEmail}>{user?.email}</Text>
      <View style={styles.roleBadge}><Text style={styles.roleText}>{user?.role || 'User'}</Text></View>
      <Pressable style={styles.logout} onPress={onLogout}><Text style={styles.logoutText}>Sign out</Text></Pressable>
    </SafeAreaView>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState('');
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, closed: 0 });
  const [recent, setRecent] = useState([]);
  const [overviewError, setOverviewError] = useState('');

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      setBooting(true);
      setBootError('');
      try {
        const token = await SecureStore.getItemAsync('goexpo-token');
        if (token) {
          setAuthToken(token);
          try {
            const response = await authApi.profile();
            if (active) setUser(response.data);
          } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
              await SecureStore.deleteItemAsync('goexpo-token');
              setAuthToken(null);
            } else if (active) {
              setBootError(getErrorMessage(error, 'Could not restore your session.'));
            }
          }
        }
      } catch (error) {
        if (active) setBootError(getErrorMessage(error, 'Could not access secure session storage.'));
      } finally {
        if (active) setBooting(false);
      }
    };
    restoreSession();
    return () => { active = false; };
  }, [restoreAttempt]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setOverviewError('');
    Promise.all([complaintApi.stats(), complaintApi.list()])
      .then(([statsResponse, listResponse]) => {
        if (!active) return;
        setStats(statsResponse.data || { total: 0, pending: 0, assigned: 0, closed: 0 });
        setRecent(Array.isArray(listResponse.data) ? listResponse.data : []);
      })
      .catch((error) => {
        if (active) setOverviewError(getErrorMessage(error, 'Could not refresh the overview.'));
      });
    return () => { active = false; };
  }, [user, refreshKey]);

  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      const { token, user: userData } = response.data;
      if (!token || !userData) throw new Error('The server returned an invalid sign-in response.');
      await SecureStore.setItemAsync('goexpo-token', token);
      setAuthToken(token);
      setUser(userData);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Sign in failed. Please try again.'));
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('goexpo-token');
      setAuthToken(null);
      setUser(null);
      setBootError('');
      setStats({ total: 0, pending: 0, assigned: 0, closed: 0 });
      setRecent([]);
    } catch (error) {
      Alert.alert('Could not sign out', getErrorMessage(error, 'Could not clear the saved session.'));
    }
  };

  if (booting) {
    return <View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  if (bootError && !user) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.recovery} edges={['top', 'bottom']}>
          <StatusBar style="dark" />
          <View style={styles.recoveryMark}><Text style={styles.recoveryMarkText}>G</Text></View>
          <Text style={styles.recoveryTitle}>Can’t connect yet</Text>
          <Text style={styles.recoveryCopy}>{bootError}</Text>
          <Button title="Try again" onPress={() => setRestoreAttempt((attempt) => attempt + 1)} style={styles.recoveryButton} />
          <Button title="Clear saved session" secondary onPress={logout} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="App">
              {() => <HomeTabs user={user} onLogout={logout} onRefresh={() => setRefreshKey((value) => value + 1)} refreshKey={refreshKey} stats={stats} recent={recent} overviewError={overviewError} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="SignIn">
              {() => <LoginScreen onLogin={login} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  tabBar: { height: 68, paddingTop: 7, paddingBottom: 8, borderTopColor: colors.line, backgroundColor: colors.surface },
  tabLabel: { fontWeight: '600', fontSize: 10 },
  tabIcon: { fontSize: 22, lineHeight: 24 },
  account: { flex: 1, backgroundColor: colors.background, alignItems: 'center', padding: 25, paddingTop: 75 },
  accountAvatar: { width: 82, height: 82, borderRadius: 29, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  accountAvatarText: { color: colors.primary, fontSize: 34, fontWeight: '800' },
  accountName: { color: colors.ink, fontSize: 23, fontWeight: '800', marginTop: 18 },
  accountEmail: { color: colors.muted, fontSize: 14, marginTop: 6 },
  roleBadge: { backgroundColor: colors.primaryLight, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, marginTop: 17 },
  roleText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  logout: { marginTop: 40, minHeight: 52, width: '100%', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0CDCD', backgroundColor: '#FFF5F5', borderRadius: 15 },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  recovery: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 26 },
  recoveryMark: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  recoveryMarkText: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  recoveryTitle: { color: colors.ink, fontSize: 28, fontWeight: '800' },
  recoveryCopy: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10, marginBottom: 24 },
  recoveryButton: { marginBottom: 11 },
});
