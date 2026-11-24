import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { IconName } from '@/components/Icon';
import { C, F } from '@/lib/theme';

const TABS: [string, string, IconName][] = [['index', 'Today', 'home'], ['program', 'Program', 'route'], ['coach', 'Coach', 'chat'], ['kid', 'Kid zone', 'star'], ['progress', 'Progress', 'chart']];

export default function TabLayout() {
  // Poppins is taller than the system font, and Android draws edge-to-edge, so give the bar
  // explicit room for icon + label and lift it above the phone's own navigation bar.
  const ins = useSafeAreaInsets();
  const bottom = Math.max(ins.bottom, 8);
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: C.brand,
      tabBarInactiveTintColor: C.ink3,
      tabBarStyle: { backgroundColor: 'rgba(255,255,255,0.97)', borderTopColor: C.line, height: 66 + bottom, paddingTop: 4, paddingBottom: bottom },
      tabBarLabelStyle: { fontFamily: F.m, fontSize: 11, lineHeight: 15 },
      sceneStyle: { backgroundColor: C.bg },
    }}>
      {TABS.map(([name, title, ic]) => <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ color }) => <Icon name={ic} size={23} color={color as string} /> }} />)}
    </Tabs>
  );
}
