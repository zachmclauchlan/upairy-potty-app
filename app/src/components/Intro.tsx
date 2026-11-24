// First-run walkthrough: shown once after setup, replayable from Settings.
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, Sub, Btn, IconBox } from './ui';
import type { IconName } from './Icon';
import { C, shadow, Tone } from '@/lib/theme';
import { S, update } from '@/lib/store';

type Line = [IconName, Tone, string, string];
type Slide = { k: string; title: string; lead: string; lines?: Line[]; demo?: 'notif' | 'loop' };

const slides = (): Slide[] => {
  const nm = S.child.name || 'your child';
  return [
    { k: 'day', title: 'Your day in three steps', lead: "This is the whole routine. It takes a few minutes a day.", lines: [
      ['sunrise', 'sun', 'Morning', 'Log the wake-up. It starts the timer and shows today\'s step.'],
      ['drop', 'ok', 'Through the day', 'Offer the potty when reminded, then log what happened.'],
      ['moon', 'water', 'Evening', 'A 20-second check-in that plans tomorrow.']] },
    { k: 'notif', title: 'Log straight from the reminder', lead: `A few minutes before ${nm} is likely to need to go, you'll get a nudge. Tap a button on it to log what happened in one tap.`, demo: 'notif' },
    { k: 'learn', title: `The timer learns ${nm}`, lead: 'It starts with your program\'s timing. As you log, it learns their real rhythm.', lines: [
      ['spark', 'water', 'Gets more personal', 'After about 6 logged wees it switches to their own pattern.'],
      ['cup', 'water', 'Drinks and naps count', 'Log a drink and the next try comes sooner.'],
      ['moon', 'try', 'Quiet hours and pause', 'No reminders overnight. Pause for naps or outings.'],
      ['heart', 'acc', 'Missed one? Fine', 'It moves on to the next try instead of nagging.']] },
    { k: 'loop', title: 'The program moves when you check in', lead: "Each step has a goal. The evening check-in looks at the day and suggests staying or moving on. Rushing ahead usually means more accidents, so it's built to take it one day at a time.", demo: 'loop' },
    { k: 'more', title: 'Help and fun, when you need it', lead: 'Everything else lives in the tabs at the bottom.', lines: [
      ['chat', 'water', 'Coach', 'Refusing to sit, accidents, holding poo: steps and the words to say.'],
      ['star', 'sun', 'Kid zone', 'Stars, stickers, rewards you choose, potty songs and kid mode.'],
      ['chart', 'ok', 'Progress', 'What the app has learned, and every day logged.'],
      ['users', 'ok', `Tap ${nm}'s name`, 'Settings, reminders, UpAiry Plus and the shop.']] },
  ];
};

export default function Intro({ open, onDone }: { open: boolean; onDone: () => void }) {
  const ins = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const all = slides(); const s = all[i]; const last = i === all.length - 1;
  const finish = () => { update(st => { st.toured = true; }); setI(0); onDone(); };
  return (
    <Modal visible={open} animationType="slide" onRequestClose={finish}>
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: ins.top + 16, paddingBottom: ins.bottom + 20, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 28 }}>
          {all.map((_, k) => <View key={k} style={{ flex: 1, height: 4, borderRadius: 9, backgroundColor: k <= i ? C.brand : C.line }} />)}
          <Pressable onPress={finish} hitSlop={12} style={{ marginLeft: 10 }}><T w="s" size={14} color={C.ink2}>Skip</T></Pressable>
        </View>
        <View style={{ flex: 1 }}>
          <T w="b" size={28} style={{ lineHeight: 33, marginBottom: 10 }}>{s.title}</T>
          <Sub style={{ fontSize: 15, lineHeight: 22, marginBottom: 22 }}>{s.lead}</Sub>
          {s.lines?.map(([ic, tone, t, d]) => <View key={t} style={{ flexDirection: 'row', gap: 14, marginBottom: 18 }}><IconBox name={ic} tone={tone} size={42} /><View style={{ flex: 1 }}><T w="s">{t}</T><Sub>{d}</Sub></View></View>)}
          {s.demo === 'notif' ? <View style={[{ backgroundColor: C.surface, borderRadius: 22, padding: 14 }, shadow]}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' }}><T w="fun" size={18} color="#fff">U</T></View>
              <View style={{ flex: 1 }}><T w="s" size={14}>{S.child.name || 'Your child'} may need to go soon</T><Sub>Good time to offer the potty, around 10:40 AM.</Sub></View>
            </View>
            {['Wee on the potty', 'Sat, nothing came', 'Accident'].map(b => <View key={b} style={{ borderTopWidth: 1, borderTopColor: C.line, marginTop: 10, paddingTop: 10, alignItems: 'center' }}><T w="m" size={14} color={C.water}>{b}</T></View>)}
          </View> : null}
          {s.demo === 'loop' ? <View style={[{ backgroundColor: C.surface, borderRadius: 22, padding: 16, gap: 12 }, shadow]}>
            {([['check', 'ok', 'Goal met', 'Move on to the next step'], ['replay', 'sun', 'Not there yet', 'Repeat the step tomorrow'], ['heart', 'acc', 'Hard day', 'Go back a step, no harm done']] as const).map(([ic, tone, t, d]) =>
              <View key={t} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><IconBox name={ic} tone={tone} size={36} /><View style={{ flex: 1 }}><T w="s" size={14}>{t}</T><Sub>{d}</Sub></View></View>)}
            <Sub style={{ marginTop: 4 }}>You can still change step yourself in the Program tab, and the app will tell you if a step's goal hasn't been met yet.</Sub>
          </View> : null}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {i > 0 ? <Btn kind="ghost" title="Back" style={{ flex: 1 }} onPress={() => setI(i - 1)} /> : null}
          <Btn title={last ? "Let's go" : 'Next'} style={{ flex: 2 }} onPress={() => last ? finish() : setI(i + 1)} />
        </View>
      </View>
    </Modal>
  );
}
