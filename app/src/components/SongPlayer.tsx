// Plays a potty song (Suno audio hosted on UpAiry's Shopify CDN) with the lyrics following along.
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { T, Sub } from './ui';
import Icon from './Icon';
import { C } from '@/lib/theme';

let modeSet = false;
const setLoop = (p: { loop: boolean }, v: boolean) => { p.loop = v; };
async function audioMode() {
  if (modeSet) return; modeSet = true;
  await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
}

/** Which lyric line is being sung, estimated from how far through the song we are. */
export function lineAt(lines: string[], t: number, dur: number) {
  if (!dur) return -1;
  const sung = lines.map((l, k) => (l.trim() ? k : -1)).filter(k => k >= 0);
  const intro = Math.min(8, dur * 0.08), outro = Math.min(6, dur * 0.06);
  const f = (t - intro) / Math.max(1, dur - intro - outro);
  if (f < 0 || f >= 1) return -1;
  return sung[Math.min(sung.length - 1, Math.floor(f * sung.length))];
}

/** A play / pause control with a progress bar. Calls onTime so the caller can highlight lyrics. */
export function useSong(url?: string, opts: { autoplay?: boolean; loop?: boolean } = {}) {
  const player = useAudioPlayer(url ?? null);
  const st = useAudioPlayerStatus(player);
  useEffect(() => { if (!url) return; setLoop(player, !!opts.loop); if (opts.autoplay) { audioMode().then(() => player.play()); } }, [url]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = async () => {
    if (!url) return;
    await audioMode();
    if (st.playing) player.pause();
    else { if (st.duration && st.currentTime >= st.duration - 0.5) player.seekTo(0); player.play(); }
  };
  const stop = () => { if (url) { player.pause(); player.seekTo(0); } };
  return { player, playing: st.playing, time: st.currentTime || 0, dur: st.duration || 0, loaded: st.isLoaded, toggle, stop };
}

export function PlayBar({ song, light }: { song: ReturnType<typeof useSong>; light?: boolean }) {
  const pct = song.dur ? Math.min(100, (song.time / song.dur) * 100) : 0;
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable onPress={song.toggle} accessibilityLabel={song.playing ? 'Pause' : 'Play'} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={song.playing ? 'pause' : 'music'} size={22} color="#fff" />
      </Pressable>
      <View style={{ flex: 1 }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: light ? '#EFE7D2' : C.sunk, overflow: 'hidden' }}>
          <View style={{ width: `${pct}%`, height: 6, backgroundColor: C.brand }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Sub style={{ fontSize: 12 }}>{mmss(song.time)}</Sub>
          <Sub style={{ fontSize: 12 }}>{song.loaded ? mmss(song.dur) : 'Loading…'}</Sub>
        </View>
      </View>
    </View>
  );
}

export function Lyrics({ lines, active, size = 20 }: { lines: string[]; active: number; size?: number }) {
  return <View style={{ gap: 2 }}>
    {lines.map((l, k) => l.trim()
      ? <T key={k} w="fun" size={size} color={active < 0 || active === k ? C.ink : C.ink3} style={{ textAlign: 'center', lineHeight: Math.round(size * 1.4) }}>{l}</T>
      : <View key={k} style={{ height: 12 }} />)}
  </View>;
}
