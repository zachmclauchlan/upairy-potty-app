import { useEffect, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Chewy_400Regular } from '@expo-google-fonts/chewy';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Auth from '@/components/Auth';
import Onboarding from '@/components/Onboarding';
import Sheets from '@/components/Sheets';
import Overlays from '@/components/Overlays';
import Intro from '@/components/Intro';
import { ToastHost, T, Sub, Btn } from '@/components/ui';
import { C } from '@/lib/theme';
import { useApp, S, update } from '@/lib/store';
import { ensureSession, refreshPlan } from '@/lib/backend';
import { startBackup, backupNow } from '@/lib/backup';
import { initNotifications, handleResponse, reschedule, Notifications } from '@/lib/notifications';
import { on } from '@/lib/bus';

SplashScreen.preventAutoHideAsync().catch(() => {});

function useNotifications() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    initNotifications().then(reschedule).catch(() => {});
    // taps and button presses on reminders, including the one that opened the app
    Notifications.getLastNotificationResponseAsync?.().then((r: any) => { if (r) handleResponse(r); }).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, []);
}

export default function Root() {
  const st = useApp();
  const [loaded, error] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Chewy_400Regular });
  useEffect(() => { if (loaded || error) SplashScreen.hideAsync().catch(() => {}); }, [loaded, error]);
  useNotifications();
  const [replay, setReplay] = useState(false);
  useEffect(() => on('intro', () => setReplay(true)), []);
  // Always signed in: on launch and whenever the app comes back, keep the sign-in alive (quietly signing
  // back in if needed). Offline keeps the parent in the app; only a sign-in that no longer matches the
  // order sends them to the sign-in screen.
  useEffect(() => {
    const check = () => { if (!S.account) return; ensureSession().then(st => { if (st === 'signed-out') update(s => { s.account = null; }); else if (st === 'ok') refreshPlan().catch(() => {}); }).catch(() => {}); };
    check();
    const sub = AppState.addEventListener('change', s => { if (s === 'active') check(); });
    return () => sub.remove();
  }, []);
  // cloud backup: upload a while after changes, and straight away when the app goes to the background
  useEffect(() => {
    const stop = startBackup();
    // Back in the app: rebuild reminders (time has passed, a pause may have ended, the timezone may have changed).
    const sub = AppState.addEventListener('change', s => { if (s !== 'active') backupNow().catch(() => {}); else reschedule(); });
    return () => { stop(); sub.remove(); };
  }, []);
  // rebuild reminders whenever logs or settings change
  useEffect(() => { const t = setTimeout(() => reschedule(), 600); return () => clearTimeout(t); }, [st.events.length, st.pausedUntil, st.mode, st.interval, st.quietOn, st.quietStart, st.quietEnd, JSON.stringify(st.rem), st.pIdx, Object.keys(st.checkins).length, st.onboarded]);
  // let sheets switch tabs
  useEffect(() => on('shop', () => router.push({ pathname: '/settings', params: { focus: 'shop' } })), []);
  useEffect(() => on('tab', (t: string) => router.navigate(t === 'program' ? '/program' : t === 'coach' ? '/coach' : '/')), []);
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {!S.account ? <Auth /> : !S.onboarded ? <Onboarding /> : <>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          </Stack>
          <Sheets />
          <Overlays />
          <Intro open={!S.toured || replay} onDone={() => setReplay(false)} />
        </>}
        <ToastHost />
      </View>
    </SafeAreaProvider>
  );
}

/** If any screen crashes, show a friendly retry instead of a blank screen. Data is safe on the phone. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <T w="b" size={22} style={{ textAlign: 'center' }}>Something went wrong</T>
      <Sub style={{ textAlign: 'center', marginTop: 8, marginBottom: 20 }}>Your logs are safe. Tap to try again. If it keeps happening, contact us from upairy.com.</Sub>
      <Btn title="Try again" onPress={() => { retry().catch(() => {}); }} />
      <Sub style={{ textAlign: 'center', marginTop: 16, fontSize: 11 }}>{String(error?.message ?? '').slice(0, 160)}</Sub>
    </View>
  );
}
