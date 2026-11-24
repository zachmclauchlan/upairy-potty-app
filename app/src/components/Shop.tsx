// UpAiry products, from upairy.com, shown where they help.
import { Image, Pressable, ScrollView, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Card, T, Sub, Label, Meter } from './ui';
import Icon from './Icon';
import { C, shadow } from '@/lib/theme';
import { S, update, sod, DAY } from '@/lib/store';
import { CDN, DESIGNS, PAIRS, PRODUCTS, SHOP } from '@/lib/content';
import { dayStats, item, M } from '@/lib/logic';

export const openShop = (path = '') => WebBrowser.openBrowserAsync(path.startsWith('http') ? path : SHOP + path).catch(() => {});

export function ProductCard({ k }: { k: string }) {
  const p = PRODUCTS[k];
  return (
    <Pressable onPress={() => openShop(p.h)} style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.surface, borderRadius: 20, padding: 10, paddingRight: 14, marginBottom: 10 }, shadow]}>
      <Image source={{ uri: CDN + p.img }} style={{ width: 72, height: 72, borderRadius: 14, backgroundColor: C.sunk }} />
      <View style={{ flex: 1 }}>
        <T w="s" size={14} style={{ lineHeight: 18 }}>{p.t}</T>
        <T size={12} color={C.ink2}>{p.why}</T>
        <T w="s" size={13} color={C.brand} style={{ marginTop: 4 }}>{p.p} <T size={13} color={C.ink3}>· upairy.com</T></T>
      </View>
      <Icon name="chevR" size={18} color={C.ink3} />
    </Pressable>
  );
}

export function Designs() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, marginBottom: 12 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
      {DESIGNS.map(([n, img, h]) => <Pressable key={n} onPress={() => openShop('upairy-potty-training-underwear-' + h)} style={{ width: 96, alignItems: 'center' }}>
        <Image source={{ uri: CDN + img }} style={{ width: 96, height: 96, borderRadius: 18, backgroundColor: C.surface }} />
        <T w="s" size={12} style={{ marginTop: 6 }}>{n}</T>
      </Pressable>)}
    </ScrollView>
  );
}

export function stepProducts(): string[] {
  const t = item().t.toLowerCase();
  if (S.method === 'night') return S.pIdx >= 2 ? ['bedmat', 'nightkit'] : ['nightkit'];
  if (t.includes('out and about')) return ['wetbag'];
  if (t.includes('independence')) return ['soap'];
  if (S.method === 'threeday' && S.pIdx <= 3) return ['pants10', 'daykit'];
  return ['pants5', 'daykit'];
}

export function PantsPlanner() {
  const need = PAIRS[S.method] || 8, have = S.pants;
  const today = sod(Date.now()); const avg = Math.round([1, 2, 3].map(d => dayStats(today - d * DAY).a).reduce((a, b) => a + b, 0) / 3);
  const enough = have >= need; const every = Math.max(1, Math.floor(have / Math.max(avg, 1)));
  const step = (d: number) => update(s => { s.pants = Math.max(0, Math.min(40, s.pants + d)); });
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ flex: 1 }}><Label>Training pants on hand</Label><Sub>{M().name}: about {need} pairs recommended</Sub></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.sunk, borderRadius: 12, padding: 3 }}>
          <Pressable onPress={() => step(-1)} style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}><T w="s" size={20}>−</T></Pressable>
          <T w="s" size={16} style={{ minWidth: 26, textAlign: 'center' }}>{have}</T>
          <Pressable onPress={() => step(1)} style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}><T w="s" size={20}>+</T></Pressable>
        </View>
      </View>
      <Meter pct={have / need * 100} color={enough ? C.brand : C.sun} style={{ marginTop: 12 }} />
      <Sub style={{ marginTop: 8 }}>{have === 0 ? 'Add how many pairs you have to plan your washing.' : enough ? `Enough pairs.${avg ? ` At about ${avg} accident${avg > 1 ? 's' : ''} a day, a wash every ${every} day${every > 1 ? 's' : ''} keeps you covered.` : ''}` : `${need - have} more pair${need - have > 1 ? 's' : ''} would mean less washing during the busy first days.`}</Sub>
    </Card>
  );
}
