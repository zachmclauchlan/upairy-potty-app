import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Screen, Header, Card, T, Sub, IconBox, SectionHead, Row, Chip } from '@/components/ui';
import Icon from '@/components/Icon';
import KidChip from '@/components/KidChip';
import { C, F, shadow } from '@/lib/theme';
import { S, update, useApp } from '@/lib/store';
import { ARTICLES, SITUATIONS, SUGG, toneOf } from '@/lib/content';
import { aiContext, localAnswer } from '@/lib/logic';
import { emit, on } from '@/lib/bus';

import { askCoachServer } from '@/lib/backend';

// The AI coach runs on UpAiry's server (Supabase function "coach"), which holds the Claude key
// and the UpAiry coach skill. The app sends only the question, recent chat and an anonymous summary.
let inFlight = false;
/** A question cut off by closing the app leaves "Thinking…" behind: tidy it up. */
function tidyChat() {
  const last = S.chat[S.chat.length - 1];
  if (!inFlight && last?.r === 'a' && last.t === 'Thinking…') update(() => { last.t = "That answer didn't finish. Please ask again."; });
}
async function ask(q: string) {
  q = q.trim(); if (!q || inFlight) return;
  inFlight = true;
  update(s => { s.chat.push({ r: 'u', t: q }); if (s.chat.length > 120) s.chat = s.chat.slice(-120); });
  update(s => { s.chat.push({ r: 'a', t: 'Thinking…', src: 'UpAiry coach' }); });
  const msg = S.chat[S.chat.length - 1];
  const history = S.chat.slice(0, -2).slice(-12).map(m => ({ role: m.r === 'u' ? 'user' as const : 'assistant' as const, text: m.t }));
  const res = await askCoachServer(q, history, aiContext()).catch(() => ({ error: 'offline' } as { reply?: string; remaining?: number; error?: string }));
  inFlight = false;
  const guide = localAnswer(q);
  if (res.reply) { msg.t = res.reply; msg.src = `UpAiry coach${res.remaining != null && res.remaining <= 5 ? ` · ${res.remaining} questions left today` : ''}`; }
  else if (res.error === 'daily_limit') { msg.t = "That's today's questions used up. The coach resets tomorrow. Meanwhile, here's what the guides say:\n\n" + guide.t; msg.src = guide.src; }
  else if (res.error === 'busy') { msg.t = "The coach is very busy right now. Try again in a minute. Meanwhile, here's what the guides say:\n\n" + guide.t; msg.src = guide.src; }
  else if (res.error === 'not_plus') { msg.t = "The AI coach is part of Potty Up. Meanwhile, here's what the built-in guides say:\n\n" + guide.t; msg.src = guide.src; }
  else { msg.t = "Couldn't reach the coach just now. Here's what the guides say:\n\n" + guide.t; msg.src = guide.src; }
  update(() => {});
}

export default function Coach() {
  useApp();
  const [q, setQ] = useState('');
  const scroll = useRef<any>(null);
  useEffect(() => { tidyChat(); }, []);
  useEffect(() => on('ask', (t: string) => { ask(t); setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 200); }), []);
  const send = (t: string) => { ask(t); setQ(''); setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 200); };
  const chat = S.chat.slice(-12);
  return (
    <Screen scrollRef={scroll}>
      <Header title="Coach" eyebrow="Calm help, right when you need it" right={<KidChip />} />
      <SectionHead title="Right now" right="Works offline" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {SITUATIONS.map((s, i) => <Pressable key={s.k} onPress={() => emit('situation', i)} style={[{ width: '48%', flexGrow: 1, backgroundColor: C.surface, borderRadius: 18, padding: 14, gap: 10 }, shadow]}>
          <IconBox name={s.ic} tone={toneOf(s.tone)} size={36} /><T w="s" size={14} style={{ lineHeight: 18 }}>{s.t}</T>
        </Pressable>)}
      </View>
      <SectionHead title="Ask the coach" right="What it sees" onRight={() => emit('aiinfo')} />
      {chat.length ? <View style={{ gap: 8, marginBottom: 10 }}>{chat.map((m, i) => (
        <View key={i} style={[{ maxWidth: '86%', paddingVertical: 11, paddingHorizontal: 14, borderRadius: 18 }, m.r === 'u' ? { alignSelf: 'flex-end', backgroundColor: C.brand, borderBottomRightRadius: 6 } : [{ alignSelf: 'flex-start', backgroundColor: C.surface, borderBottomLeftRadius: 6 }, shadow]]}>
          <T size={14} color={m.r === 'u' ? '#fff' : C.ink} style={{ lineHeight: 21 }}>{m.t}</T>
          {m.src ? <T size={11} color={C.ink3} style={{ marginTop: 6 }}>{m.src}</T> : null}
        </View>))}</View>
        : <Card><Sub style={{ fontSize: 14 }}>Ask anything about {S.child.name}'s training. The coach knows {S.child.name}'s program and recent logs, never their name.</Sub></Card>}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TextInput value={q} onChangeText={setQ} onSubmitEditing={() => send(q)} returnKeyType="send" placeholder="e.g. Why so many accidents after lunch?" placeholderTextColor={C.ink3} style={{ flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.surface, paddingHorizontal: 14, paddingVertical: 12, fontFamily: F.r, fontSize: 15, color: C.ink }} />
        <Pressable onPress={() => send(q)} accessibilityLabel="Send" style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' }}><Icon name="send" color="#fff" /></Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, marginTop: 10 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {SUGG.map(s => <Chip key={s} label={s} onPress={() => send(s)} />)}
      </ScrollView>
      {S.chat.length ? <Pressable onPress={() => update(s => { s.chat = []; })} style={{ alignSelf: 'center', marginTop: 12 }}><T w="s" size={14} color={C.ink2}>Clear conversation</T></Pressable> : null}
      <SectionHead title="Guides" />
      <Card pad={4} style={{ paddingHorizontal: 18 }}>{ARTICLES.map((a, i) => <Row key={a.t} first={i === 0} icon={a.ic} tone={toneOf(a.tone)} title={a.t} sub={`${a.m} min read`} onPress={() => emit('article', i)} />)}</Card>
      <Sub style={{ textAlign: 'center', marginTop: 16 }}>General guidance, not medical advice. If something worries you, check with your doctor.</Sub>
    </Screen>
  );
}
