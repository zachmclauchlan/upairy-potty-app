import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Screen, Header, Card, T, Sub, Btn, SectionHead, Label, Link, Meter, IconBox, toast, confirmAsk } from '@/components/ui';
import Sticker from '@/components/Sticker';
import Icon from '@/components/Icon';
import KidChip from '@/components/KidChip';
import { lyr } from '@/components/Sheets';
import { C, outline, shadow } from '@/lib/theme';
import { S, update, useApp } from '@/lib/store';
import { SONGS } from '@/lib/content';
import { isPotty, starsNow, starsEarned } from '@/lib/logic';
import { emit } from '@/lib/bus';
import { tourRef } from '@/lib/tour';
import SongMenu from '@/components/SongMenu';

// Earned stickers sit on raised, coloured tiles, like stickers stuck on a chart.
const TILES = [C.surface, C.brandSoft, C.waterSoft, C.sunSoft, C.mealSoft];

export default function Kid() {
  useApp();
  const [menu, setMenu] = useState(false);
  const nm = S.child.name, stars = starsNow();
  const wins = Math.max(0, S.events.filter(e => isPotty(e) && e.outcome === 'success').length - (S.stickerBase ?? 0)); const filled = wins % 30, page = Math.floor(wins / 30) + 1;
  const resetStars = () => confirmAsk('Reset stars?', `${nm}'s stars go back to 0 and the sticker chart starts a fresh page. Logs and progress aren't affected.`, 'Reset', () => { update(s => { s.spent = starsEarned(); s.stickerBase = s.events.filter(e => isPotty(e) && e.outcome === 'success').length; }); toast('Stars reset', 'A fresh start for the next reward'); });
  return (
    <Screen tour="kid">
      <Header title="Kid zone" eyebrow={`For ${nm}`} right={<KidChip />} />
      <View ref={tourRef('kid-stars')} collapsable={false} style={[{ borderRadius: 20, padding: 20, backgroundColor: C.hi, marginBottom: 16 }, shadow]}>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <T w="fun" size={64} style={{ fontVariant: ['tabular-nums'] }}>{stars}</T>
          <View style={{ flex: 1 }}>
            <T w="fun" size={22}>stars to spend</T>
            <T size={13} color={C.ink2}>2 for a wee or poo on the potty, 1 for trying, 3 for a dry night</T>
          </View>
        </View>
        <Btn icon="smile" title={`Hand the phone to ${nm}`} onPress={() => emit('kidmode')} style={{ marginTop: 16 }} />
        <View style={{ marginTop: 12, alignItems: 'center' }}><Link label="Reset stars" onPress={resetStars} /></View>
      </View>
      <View ref={tourRef('kid-stickers')} collapsable={false}><Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Label>Sticker chart{page > 1 ? ` · page ${page}` : ''}</Label><Sub>{filled}/30</Sub></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {[...Array(30)].map((_, i) => <View key={i} style={[{ width: '14.2%', aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, i < filled ? { backgroundColor: TILES[i % TILES.length], ...shadow } : { borderWidth: 2, borderStyle: 'dashed', borderColor: C.line }]}>{i < filled ? <Sticker i={i + (page - 1) * 30} /> : null}</View>)}
        </View>
        <Sub style={{ marginTop: 12 }}>A new sticker for every success on the potty</Sub>
      </Card></View>
      <View ref={tourRef('kid-rewards')} collapsable={false}>
      <SectionHead title="Rewards" right="Add reward" onRight={() => emit('addreward')} />
      <Card pad={4} style={{ paddingHorizontal: 16 }}>
        {S.rewards.length ? S.rewards.map((r, i) => { const ok = stars >= r.cost; return (
          <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
            <IconBox name="gift" tone="sun" />
            <View style={{ flex: 1 }}><T w="s" size={14}>{r.t}</T><T size={12} color={C.ink2}>{Math.min(stars, r.cost)} of {r.cost} stars</T><Meter pct={stars / r.cost * 100} style={{ marginTop: 6 }} /></View>
            <Pressable onPress={() => { if (!ok) { toast('Not enough stars yet', `${r.cost - stars} more to go`); return; } update(s => { s.spent += r.cost; }); emit('celebrate', { title: 'Reward time', sub: r.t }); }} style={[{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, backgroundColor: ok ? C.brand : C.surface }, outline, !ok && { opacity: 0.5 }]}>
              <T w="s" size={13} color={ok ? '#fff' : C.ink}>{ok ? 'Redeem' : 'Locked'}</T>
            </Pressable>
          </View>); }) : <Sub style={{ paddingVertical: 20, textAlign: 'center' }}>Add a reward your child is excited about.</Sub>}
      </Card>
      </View>
      <SectionHead title="Potty songs" right={`${SONGS.length} songs`} />
      <Pressable onPress={() => setMenu(true)} accessibilityRole="button" accessibilityLabel="Choose the potty time song">
        <Card pad={16}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <IconBox name="hour" tone="ok" />
            <View style={{ flex: 1 }}>
              <T w="s" size={14}>Potty time song</T>
              <T size={12} color={C.ink2}>{S.sitSong != null && SONGS[S.sitSong] ? `${SONGS[S.sitSong].t} plays while ${S.child.name || 'your child'} sits` : 'Surprise me: a favourite (or any song) each sit'}</T>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}><T w="s" size={13} color={C.brandInk}>Change</T><Icon name="chevR" size={14} color={C.brandInk} /></View>
          </View>
        </Card>
      </Pressable>
      <Card pad={4} style={{ paddingHorizontal: 16 }}>
        {SONGS.map((s, i) => { const fav = S.favs.includes(i); const picked = S.sitSong === i; return (
          <View key={s.t} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
            <Pressable onPress={() => emit('song', i)} style={[{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center' }, outline]}><Icon name="music" size={16} color={C.ink} /></Pressable>
            <Pressable onPress={() => emit('song', i)} style={{ flex: 1 }}><T w="s" size={14}>{s.t}{picked ? '  ·  potty song' : ''}</T><T size={12} color={C.ink2} numberOfLines={1}>{s.tag} · {lyr(i)[0]}</T></Pressable>
            <Pressable onPress={() => update(st => { st.favs = fav ? st.favs.filter(x => x !== i) : [...st.favs, i]; })} hitSlop={10}><Icon name="heart" size={20} color={fav ? C.acc : C.ink3} fill={fav ? C.acc : 'none'} /></Pressable>
          </View>); })}
      </Card>
      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <SongMenu current={S.sitSong} onPick={i => { if (i != null) toast(`${SONGS[i].t} is the potty time song`); }} onClose={() => setMenu(false)} />
      </Modal>
    </Screen>
  );
}
