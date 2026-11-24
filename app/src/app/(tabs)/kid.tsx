import { Pressable, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { Screen, Header, Card, T, Sub, Btn, SectionHead, Label, Meter, IconBox, toast } from '@/components/ui';
import Icon from '@/components/Icon';
import KidChip from '@/components/KidChip';
import { lyr } from '@/components/Sheets';
import { C } from '@/lib/theme';
import { S, update, useApp } from '@/lib/store';
import { SONGS, STKC } from '@/lib/content';
import { isPotty, starsNow, starsEarned } from '@/lib/logic';
import { emit } from '@/lib/bus';
import { tourRef } from '@/lib/tour';
import { confirmAsk } from '@/components/ui';

// Stickers: simple shapes drawn in code, so there are no image assets to license.
function Sticker({ i }: { i: number }) {
  const c = STKC[(i * 5 + Math.floor(i / 6)) % STKC.length];
  const k = i % 6;
  return <Svg width="70%" height="70%" viewBox="0 0 24 24">
    {k === 0 ? <Path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" fill={c} /> :
     k === 1 ? <Path d="M12 21s-8-4.7-8-10.7A4.6 4.6 0 0 1 12 7.6a4.6 4.6 0 0 1 8 2.7C20 16.3 12 21 12 21z" fill={c} /> :
     k === 2 ? <G><Circle cx="12" cy="12" r="5" fill={c} /><Path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" stroke={c} strokeWidth={2.2} strokeLinecap="round" /></G> :
     k === 3 ? <Path d="M12 3.5c3.2 3.9 6.2 7.2 6.2 10.8a6.2 6.2 0 0 1-12.4 0c0-3.6 3-6.9 6.2-10.8z" fill={c} /> :
     k === 4 ? <G><Circle cx="12" cy="7" r="3.6" fill={c} /><Circle cx="7" cy="12" r="3.6" fill={c} /><Circle cx="17" cy="12" r="3.6" fill={c} /><Circle cx="12" cy="17" r="3.6" fill={c} /><Circle cx="12" cy="12" r="2.6" fill="#FFD55A" /></G> :
     <Path d="M19.5 14.6A8 8 0 1 1 9.4 4.5a6.4 6.4 0 0 0 10.1 10.1z" fill={c} />}
  </Svg>;
}

export default function Kid() {
  useApp();
  const nm = S.child.name, stars = starsNow();
  const wins = Math.max(0, S.events.filter(e => isPotty(e) && e.outcome === 'success').length - (S.stickerBase ?? 0)); const filled = wins % 30, page = Math.floor(wins / 30) + 1;
  const resetStars = () => confirmAsk('Reset stars?', `${nm}'s stars go back to 0 and the sticker chart starts a fresh page. Logs and progress aren't affected.`, 'Reset', () => { update(s => { s.spent = starsEarned(); s.stickerBase = s.events.filter(e => isPotty(e) && e.outcome === 'success').length; }); toast('Stars reset', 'A fresh start for the next reward'); });
  return (
    <Screen tour="kid">
      <Header title="Kid zone" eyebrow={`For ${nm}`} right={<KidChip />} />
      <View ref={tourRef('kid-stars')} collapsable={false} style={{ borderRadius: 22, padding: 20, backgroundColor: '#FFF3CF', flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 12 }}>
        <T w="fun" size={56} color="#3D2E00" style={{ lineHeight: 62 }}>{stars}</T>
        <View style={{ flex: 1 }}>
          <T w="s" size={16} color="#3D2E00">stars to spend</T>
          <T size={13} color="#6B5A2E">2 for a wee or poo on the potty, 1 for trying, 3 for a dry night</T>
          <Btn small icon="smile" title={`Hand the phone to ${nm}`} onPress={() => emit('kidmode')} style={{ marginTop: 12 }} />
          <Pressable onPress={resetStars} hitSlop={8} style={{ marginTop: 10 }}><T w="s" size={13} color="#6B5A2E">Reset stars</T></Pressable>
        </View>
      </View>
      <View ref={tourRef('kid-stickers')} collapsable={false}><Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Label>Sticker chart{page > 1 ? ` · page ${page}` : ''}</Label><Sub>{filled}/30</Sub></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {[...Array(30)].map((_, i) => <View key={i} style={{ width: '14.2%', aspectRatio: 1, borderRadius: 14, backgroundColor: i < filled ? '#FFF8E6' : C.sunk, alignItems: 'center', justifyContent: 'center' }}>{i < filled ? <Sticker i={i + (page - 1) * 30} /> : null}</View>)}
        </View>
        <Sub style={{ marginTop: 10 }}>A new sticker for every success on the potty.</Sub>
      </Card></View>
      <View ref={tourRef('kid-rewards')} collapsable={false}>
      <SectionHead title="Rewards" right="Add reward" onRight={() => emit('addreward')} />
      <Card pad={6} style={{ paddingHorizontal: 18 }}>
        {S.rewards.length ? S.rewards.map((r, i) => { const ok = stars >= r.cost; return (
          <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
            <IconBox name="gift" tone="sun" />
            <View style={{ flex: 1 }}><T w="s" size={14}>{r.t}</T><T size={12} color={C.ink2}>{Math.min(stars, r.cost)} of {r.cost} stars</T><Meter pct={stars / r.cost * 100} color={C.sun} style={{ marginTop: 6 }} /></View>
            <Pressable onPress={() => { if (!ok) { toast('Not enough stars yet', `${r.cost - stars} more to go`); return; } update(s => { s.spent += r.cost; }); emit('celebrate', { title: 'Reward time!', sub: r.t }); }} style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, backgroundColor: ok ? C.brand : C.sunk }}>
              <T w="s" size={13} color={ok ? '#fff' : C.ink3}>{ok ? 'Redeem' : 'Locked'}</T>
            </Pressable>
          </View>); }) : <Sub style={{ paddingVertical: 20, textAlign: 'center' }}>Add a reward your child is excited about.</Sub>}
      </Card>
      </View>
      <SectionHead title="Potty songs" right={`${SONGS.length} songs`} />
      <Card pad={4} style={{ paddingHorizontal: 18 }}>
        {SONGS.map((s, i) => { const fav = S.favs.includes(i); return (
          <View key={s.t} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
            <Pressable onPress={() => emit('song', i)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center' }}><Icon name="music" size={16} color={C.brand} /></Pressable>
            <Pressable onPress={() => emit('song', i)} style={{ flex: 1 }}><T w="s" size={14}>{s.t}</T><T size={12} color={C.ink2} numberOfLines={1}>{s.tag} · {lyr(i)[0]}</T></Pressable>
            <Pressable onPress={() => update(st => { st.favs = fav ? st.favs.filter(x => x !== i) : [...st.favs, i]; })} hitSlop={10}><Icon name="heart" size={20} color={fav ? C.acc : C.ink3} fill={fav ? C.acc : 'none'} /></Pressable>
          </View>); })}
      </Card>
    </Screen>
  );
}
