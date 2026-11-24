import { Tabs } from 'expo-router';
import Icon, { IconName } from '@/components/Icon';
import { C, F } from '@/lib/theme';

const TABS: [string, string, IconName][] = [['index', 'Today', 'home'], ['program', 'Program', 'route'], ['coach', 'Coach', 'chat'], ['kid', 'Kid zone', 'star'], ['progress', 'Progress', 'chart']];

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: C.brand,
      tabBarInactiveTintColor: C.ink3,
      tabBarStyle: { backgroundColor: 'rgba(255,255,255,0.96)', borderTopColor: C.line },
      tabBarLabelStyle: { fontFamily: F.m, fontSize: 11 },
      sceneStyle: { backgroundColor: C.bg },
    }}>
      {TABS.map(([name, title, ic]) => <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ color }) => <Icon name={ic} size={23} color={color as string} /> }} />)}
    </Tabs>
  );
}
