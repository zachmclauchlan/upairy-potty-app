// Full-screen moments for the child: celebration, sit timer with a song, kid mode.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, Btn, toast } from './ui';
import Icon from './Icon';
import { lyr } from './Sheets';
import { useSong, lineAt } from './SongPlayer';
import SongMenu from './SongMenu';
import { C } from '@/lib/theme';
import { S, update } from '@/lib/store';
import { SONGS } from '@/lib/content';
import { starsNow } from '@/lib/logic';
import { logPotty } from '@/lib/actions';
import { on, emit } from '@/lib/bus';

const STAR = 'M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z';
const native = Platform.OS !== 'web';

function Confetti() {
  const { width, height } = useWindowDimensions();
  const bits = useRef([...Array(40)].map((_, i) => ({ x: Math.random() * width, d: 1800 + Math.random() * 1600, delay: Math.random() * 400, c: ['#FFD55A', '#FFFFFF', '#A8D99B', '#FFB27A'][i % 4], v: new Animated.Value(0) }))).current;
  useEffect(() => { bits.forEach(b => Animated.timing(b.v, { toValue: 1, duration: b.d, delay: b.delay, easing: Easing.linear, useNativeDriver: native }).start()); }, []);
  return <>{bits.map((b, i) => <Animated.View key={i} pointerEvents="none" style={{ position: 'absolute', top: -14, left: b.x, width: 8, height: 12, borderRadius: 2, backgroundColor: b.c, transform: [{ translateY: b.v.interpolate({ inputRange: [0, 1], outputRange: [0, height + 30] }) }, { rotate: b.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] }) }] }} />)}</>;
}

function Celebrate() {
  const [msg, setMsg] = useState<{ title: string; sub: string } | null>(null);
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => on('celebrate', (m?: { title: string; sub: string }) => { setMsg(m ?? { title: `${S.child.name} did it!`, sub: 'Big high five' }); }), []);
  useEffect(() => { if (msg) { pop.setValue(0); Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: native }).start(); } }, [msg]);
  if (!msg) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setMsg(null)}>
      <Pressable onPress={() => setMsg(null)} style={{ flex: 1, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <Confetti />
        <Animated.View style={{ transform: [{ scale: pop }] }}><Svg width={180} height={180} viewBox="0 0 24 24"><Path d={STAR} fill="#FFD55A" stroke="#fff" strokeWidth={0.8} strokeLinejoin="round" /></Svg></Animated.View>
        <T w="fun" size={50} color="#fff" style={{ marginTop: 18, lineHeight: 56, textAlign: 'center', paddingHorizontal: 20 }}>{msg.title}</T>
        <T size={16} color="rgba(255,255,255,.85)">{msg.sub}</T>
        <T size={13} color="rgba(255,255,255,.7)" style={{ position: 'absolute', bottom: 50 }}>Tap anywhere to close</T>
      </Pressable>
    </Modal>
  );
}

function SitTimer() {
  const ins = useSafeAreaInsets();
  const [open, setOpen] = useState(false); const [left, setLeft] = useState(180); const [si, setSi] = useState(0); const [line, setLine] = useState(0); const [menu, setMenu] = useState(false);
  const randomSong = () => (S.favs.length ? S.favs[Math.floor(Math.random() * S.favs.length)] : Math.floor(Math.random() * SONGS.length));
  useEffect(() => on('sit', (i?: number) => {
    setSi(i ?? S.sitSong ?? randomSong());
    setLeft(180); setLine(0); setMenu(false); setOpen(true);
  }), []);
  useEffect(() => { if (!open) return; const t = setInterval(() => setLeft(l => Math.max(0, l - 1)), 1000); return () => clearInterval(t); }, [open]);
  const sitSong = SONGS[si]; const sitLines = lyr(si).filter(x => x.trim());
  // with audio: the song plays (on loop) while they sit; without: the lines cycle to sing along
  const song = useSong(open && S.sitMusic ? sitSong?.a : undefined, { autoplay: true, loop: true });
  useEffect(() => { if (!open || !S.sitMusic || sitSong?.a) return; const t = setInterval(() => setLine(l => (l + 1) % Math.max(1, sitLines.length)), 3500); return () => clearInterval(t); }, [open, si]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!open) song.stop(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = sitSong?.a ? Math.max(0, sitLines.indexOf(lyr(si)[Math.max(0, lineAt(lyr(si), sitSong?.ts, song.time))])) : line;
  const done = (v: 'success' | 'tried') => { setOpen(false); logPotty(v, v === 'success' ? 'wee' : null); if (v === 'success') emit('celebrate'); else toast('Logged: sat, nothing came', 'Practice still counts'); };
  if (!open) return null;
  const Cc = 2 * Math.PI * 96; const sing = S.sitMusic;
  return (
    <Modal visible animationType="slide" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, backgroundColor: '#FBF7EC', alignItems: 'center', justifyContent: 'center', padding: 28, paddingTop: ins.top + 20, paddingBottom: ins.bottom + 20 }}>
        <Pressable onPress={() => setOpen(false)} hitSlop={12} style={{ position: 'absolute', top: ins.top + 14, right: 20 }}><Icon name="x" size={24} color={C.ink2} /></Pressable>
        <View style={{ width: 220, height: 220 }}>
          <Svg width={220} height={220} viewBox="0 0 216 216" style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={108} cy={108} r={96} stroke="#EFE7D2" strokeWidth={14} fill="none" />
            <Circle cx={108} cy={108} r={96} stroke={C.brand} strokeWidth={14} fill="none" strokeLinecap="round" strokeDasharray={`${Cc}`} strokeDashoffset={Cc * (1 - left / 180)} />
          </Svg>
          <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' } as any}><T w="s" size={52} style={{ letterSpacing: -2, lineHeight: 60 }}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</T></View>
        </View>
        <T w="fun" size={44} style={{ marginTop: 14, lineHeight: 50 }}>Potty time!</T>
        {sing ? <>
          <T w="fun" size={22} style={{ textAlign: 'center', minHeight: 60, marginTop: 12, lineHeight: 30 }}>{sitLines[shown] ?? ''}</T>
          <Pressable onPress={() => setMenu(true)} accessibilityLabel="Change the song" style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#EFE7D2' }}><Icon name="music" size={16} color={C.ink2} /><T w="s" size={13} color={C.ink2}>{SONGS[si].t}</T><T w="s" size={13} color={C.brand}>· Change</T></Pressable>
        </> : <T size={15} color={C.ink2} style={{ marginTop: 10 }}>Sit with {S.child.name} and read a book.</T>}
        <Pressable onPress={() => update(s => { s.sitMusic = !s.sitMusic; })} style={{ marginTop: 8 }}><T w="s" size={13} color={C.ink2}>{sing ? 'Song off' : 'Song on'}</T></Pressable>
        <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 26 }}>
          <Btn kind="ghost" title="Nothing came" style={{ flex: 1, backgroundColor: '#EFE7D2' }} onPress={() => done('tried')} />
          <Btn title="They went!" style={{ flex: 1 }} onPress={() => done('success')} />
        </View>
      </View>
      {menu ? <SongMenu current={S.sitSong == null ? null : si} onPick={i => { setSi(i ?? randomSong()); setLine(0); }} onClose={() => setMenu(false)} /> : null}
    </Modal>
  );
}

function KidMode() {
  const ins = useSafeAreaInsets();
  const [open, setOpen] = useState(false); const [burst, setBurst] = useState<{ n: number; t: string } | null>(null);
  const hold = useRef(new Animated.Value(0)).current; const timer = useRef<any>(null);
  useEffect(() => on('kidmode', () => setOpen(true)), []);
  const tap = (v: 'wee' | 'poo' | 'tried') => {
    logPotty(v === 'tried' ? 'tried' : 'success', v === 'tried' ? null : v, 'child');
    setBurst({ n: v === 'tried' ? 1 : 2, t: v === 'tried' ? 'Great trying!' : `${S.child.name} did it!` });
  };
  const start = () => { Animated.timing(hold, { toValue: 1, duration: 1500, useNativeDriver: false }).start(); timer.current = setTimeout(() => { setOpen(false); hold.setValue(0); }, 1500); };
  const end = () => { clearTimeout(timer.current); hold.stopAnimation(); hold.setValue(0); };
  if (!open) return null;
  const tile = (bg: string, ic: any, label: string, onPress: () => void) => <Pressable onPress={onPress} style={({ pressed }) => ({ flex: 1, borderRadius: 28, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', gap: 10, transform: [{ scale: pressed ? 0.95 : 1 }] })}><Icon name={ic} size={64} color="#fff" stroke={1.6} /><T w="fun" size={24} color="#fff">{label}</T></Pressable>;
  return (
    <Modal visible animationType="fade" onRequestClose={() => {}}>
      <View style={{ flex: 1, backgroundColor: '#FBF7EC', paddingTop: ins.top + 24, paddingBottom: ins.bottom + 20, paddingHorizontal: 20 }}>
        <T w="fun" size={44} style={{ lineHeight: 50 }}>Hi {S.child.name}!</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 20 }}><Icon name="star" size={22} color={C.star} fill={C.star} /><T w="fun" size={22} color="#8A6400">{starsNow()} stars</T></View>
        <View style={{ flex: 1, gap: 12 }}>
          <View style={{ flex: 1, flexDirection: 'row', gap: 12 }}>{tile('#3E7F33', 'drop', 'I did a wee', () => tap('wee'))}{tile('#8B6447', 'poo', 'I did a poo', () => tap('poo'))}</View>
          <View style={{ flex: 1, flexDirection: 'row', gap: 12 }}>{tile('#3A78C9', 'hour', 'I sat and tried', () => tap('tried'))}{tile('#C9762A', 'music', 'Potty song', () => emit('sit'))}</View>
        </View>
        <Pressable onPressIn={start} onPressOut={end} style={{ alignSelf: 'center', marginTop: 18, borderRadius: 99, overflow: 'hidden', backgroundColor: '#EFE7D2' }}>
          <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: hold.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: 'rgba(62,127,51,.3)' }} />
          <T w="s" size={13} color={C.ink2} style={{ paddingVertical: 10, paddingHorizontal: 16 }}>Grown-ups: press and hold to exit</T>
        </Pressable>
        {burst ? <Pressable onPress={() => setBurst(null)} style={{ position: 'absolute', inset: 0, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' } as any}>
          <Confetti />
          <Svg width={180} height={180} viewBox="0 0 24 24"><Path d={STAR} fill="#FFD55A" stroke="#fff" strokeWidth={0.8} strokeLinejoin="round" /></Svg>
          <T w="fun" size={52} color="#fff" style={{ lineHeight: 58 }}>+{burst.n} star{burst.n > 1 ? 's' : ''}!</T>
          <T size={16} color="rgba(255,255,255,.85)">{burst.t}</T>
          <T size={13} color="rgba(255,255,255,.7)" style={{ position: 'absolute', bottom: 50 }}>Tap anywhere to continue</T>
        </Pressable> : null}
      </View>
    </Modal>
  );
}

/** Spend stars on a reward: shows a big moment for the child. */
export function useRewardBurst() { return (t: string) => emit('celebrate', { title: 'Reward time!', sub: t }); }

export default function Overlays() { return <><Celebrate /><SitTimer /><KidMode /></>; }
