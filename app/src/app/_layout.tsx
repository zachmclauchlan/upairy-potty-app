import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
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
import { ToastHost } from '@/components/ui';
import { C } from '@/lib/theme';
import { useApp, S, update } from '@/lib/store';
import { isSignedIn, refreshPlan } from '@/lib/backend';
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
  // On launch: a saved account without a real sign-in (e.g. from the test version) goes back to
  // sign-in; a real one gets its plan refreshed from the server.
  useEffect(() => {
    isSignedIn().then(ok => { if (!ok && S.account) update(s => { s.account = null; }); else if (ok) refreshPlan().catch(() => {}); }).catch(() => {});
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
