import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { IconName } from '@/components/Icon';
import { BW, C, F } from '@/lib/theme';
import { useApp } from '@/lib/store';

const TABS: [string, string, IconName][] = [['index', 'Today', 'home'], ['program', 'Program', 'route'], ['coach', 'Coach', 'chat'], ['kid', 'Kid zone', 'star'], ['progress', 'Progress', 'chart']];

export default function TabLayout() {
  useApp(); // the page colour follows the theme picked in Settings
  // Android draws edge-to-edge, so give the bar explicit room for icon + label and lift it above
  // the phone's own navigation bar.
  const ins = useSafeAreaInsets();
  const bottom = Math.max(ins.bottom, 8);
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: C.ink,
      tabBarInactiveTintColor: C.ink3,
      tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.ink, borderTopWidth: BW, height: 64 + bottom, paddingTop: 4, paddingBottom: bottom },
      tabBarLabelStyle: { fontFamily: F.m, fontSize: 11, lineHeight: 16 },
      sceneStyle: { backgroundColor: C.bg },
    }}>
      {TABS.map(([name, title, ic]) => <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ color, focused }) => <Icon name={ic} size={22} color={color as string} stroke={focused ? 2.2 : 1.8} /> }} />)}
    </Tabs>
  );
}
