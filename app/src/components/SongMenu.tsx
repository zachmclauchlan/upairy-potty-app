// A menu for choosing the potty time song: "Surprise me" or any of the songs, as a list to scroll.
// Drawn as an overlay (not its own Modal) so it also works on top of the sit timer.
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, Sub } from './ui';
import Icon from './Icon';
import { C } from '@/lib/theme';
import { S, update } from '@/lib/store';
import { SONGS } from '@/lib/content';

/** current: the song shown as chosen (null = Surprise me). onPick gets the song index, or null for Surprise me. */
export default function SongMenu({ current, onPick, onClose }: { current: number | null; onPick: (i: number | null) => void; onClose: () => void }) {
  const ins = useSafeAreaInsets(); const { height } = useWindowDimensions();
  const pick = (i: number | null) => { update(st => { st.sitSong = i; }); onPick(i); onClose(); };
  const row = (i: number | null, title: string, sub: string, icon: 'music' | 'bolt') => {
    const on = current === i; const fav = i != null && S.favs.includes(i);
    return (
      <Pressable key={String(i)} onPress={() => pick(i)} accessibilityRole="button" accessibilityState={{ selected: on }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 14, backgroundColor: on ? C.brandSoft : 'transparent' }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: on ? C.brand : C.sunk, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={16} color={on ? '#fff' : C.ink2} />
        </View>
        <View style={{ flex: 1 }}>
          <T w="s" size={15}>{title}</T>
          <Sub style={{ fontSize: 12 }}>{sub}</Sub>
        </View>
        {fav ? <Icon name="heart" size={15} color={C.acc} fill={C.acc} /> : null}
        {on ? <Icon name="check" size={18} color={C.brand} stroke={2.4} /> : null}
      </Pressable>
    );
  };
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', zIndex: 50 }}>
      <Pressable onPress={onClose} accessibilityLabel="Close the song menu" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30,26,20,.45)' }} />
      <View style={{ backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingBottom: ins.bottom + 12, maxHeight: height * 0.78 }}>
        <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: C.line, marginBottom: 10 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 6 }}>
          <T w="b" size={19} style={{ flex: 1 }}>Pick the potty song</T>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close"><Icon name="x" size={22} color={C.ink2} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 8 }}>
          {row(null, 'Surprise me', S.favs.length ? 'A favourite song each time' : 'A different song each time', 'bolt')}
          {SONGS.map((s, i) => row(i, s.t, s.tag, 'music'))}
        </ScrollView>
      </View>
    </View>
  );
}
