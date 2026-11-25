// Coach tab: one full-screen chat with Lara, the Potty Up AI coach.
// The coach runs on UpAiry's server (Supabase function "coach"), which holds the Claude key and the
// UpAiry playbook. The app sends only the question, recent chat and an anonymous summary.
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, Sub, Btn, Chip, IconBtn, Sheet, Tip } from '@/components/ui';
import Icon from '@/components/Icon';
import { BW, C, F, outline, shadow } from '@/lib/theme';
import { S, update, useApp } from '@/lib/store';
import { aiContext, localAnswer } from '@/lib/logic';
import { emit, on } from '@/lib/bus';
import { askCoachServer } from '@/lib/backend';
import { tourRef } from '@/lib/tour';
import { COACH_NAME, COACH_TAG, STARTERS, greeting } from '@/lib/coach';

const THINKING = 'Thinking…';
let inFlight = false;

/** A question cut off by closing the app leaves "Thinking…" behind: tidy it up. */
function tidyChat() {
  const last = S.chat[S.chat.length - 1];
  if (!inFlight && last?.r === 'a' && last.t === THINKING) update(() => { last.t = "That answer didn't finish. Please ask again."; });
}

/** Answer from the guides built into the app, without contacting the AI service. */
function askGuides(q: string) {
  q = q.trim(); if (!q) return;
  const guide = localAnswer(q);
  update(s => { s.chat.push({ r: 'u', t: q }); s.chat.push({ r: 'a', t: guide.t, src: guide.src }); if (s.chat.length > 120) s.chat = s.chat.slice(-120); });
}

async function ask(q: string) {
  q = q.trim(); if (!q || inFlight) return;
  inFlight = true;
  update(s => { s.chat.push({ r: 'u', t: q }); if (s.chat.length > 120) s.chat = s.chat.slice(-120); });
  update(s => { s.chat.push({ r: 'a', t: THINKING, src: COACH_NAME }); });
  const msg = S.chat[S.chat.length - 1];
  const history = S.chat.slice(0, -2).slice(-12).map(m => ({ role: m.r === 'u' ? 'user' as const : 'assistant' as const, text: m.t }));
  const res = await askCoachServer(q, history, aiContext()).catch(() => ({ error: 'offline' } as { reply?: string; remaining?: number; error?: string }));
  inFlight = false;
  const guide = localAnswer(q);
  const fallback = (why: string) => { msg.t = `${why} Meanwhile, here's what the built-in guides say:\n\n${guide.t}`; msg.src = guide.src; };
  if (res.reply) { msg.t = res.reply; msg.src = res.remaining != null && res.remaining <= 5 ? `${COACH_NAME} · ${res.remaining} questions left today` : COACH_NAME; }
  else if (res.error === 'daily_limit') fallback("That's today's questions used up. I'll be back tomorrow.");
  else if (res.error === 'busy') fallback("I'm very busy right now. Try again in a minute.");
  else fallback("I can't connect just now.");
  update(() => {});
}

function Avatar({ size = 34 }: { size?: number }) {
  return <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' }, outline]}>
    <T w="fun" size={size * 0.5} color="#fff" style={{ lineHeight: size * 0.62 }}>{COACH_NAME[0]}</T>
  </View>;
}

function Bubble({ r, t, src }: { r: 'u' | 'a'; t: string; src?: string }) {
  if (r === 'u') return <View style={[{ alignSelf: 'flex-end', maxWidth: '84%', backgroundColor: C.brand, borderRadius: 20, borderBottomRightRadius: 6, paddingVertical: 10, paddingHorizontal: 16 }, outline]}>
    <T size={15} color="#fff" style={{ lineHeight: 22 }}>{t}</T>
  </View>;
  const typing = t === THINKING;
  return <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', maxWidth: '90%' }}>
    <Avatar size={28} />
    <View style={[{ flexShrink: 1, backgroundColor: C.surface, borderRadius: 20, borderBottomLeftRadius: 6, paddingVertical: 10, paddingHorizontal: 16 }, outline]}>
      <T size={15} color={typing ? C.ink3 : C.ink} style={{ lineHeight: 22 }}>{typing ? `${COACH_NAME} is typing…` : t}</T>
      {!typing && src && src !== COACH_NAME ? <T size={12} color={C.ink3} style={{ marginTop: 6 }}>{src}</T> : null}
    </View>
  </View>;
}

export default function Coach() {
  useApp();
  const ins = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const scroll = useRef<any>(null);
  const input = useRef<any>(null);
  const toEnd = () => setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 120);
  useEffect(() => { tidyChat(); }, []);
  // Before the first question goes to the AI service, ask the parent once. The question waits here meanwhile.
  const [waiting, setWaiting] = useState<string | null>(null);
  const go = (t: string) => { if (S.aiOk) ask(t); else setWaiting(t); toEnd(); };
  const answer = (ok: boolean) => {
    const t = waiting; setWaiting(null);
    if (ok) update(s => { s.aiOk = true; });
    if (t) { if (ok) ask(t); else askGuides(t); toEnd(); }
  };
  useEffect(() => on('ask', (t: string) => go(t)), []);
  const send = (t: string) => { if (!t.trim()) return; go(t); setQ(''); };
  const empty = S.chat.length === 0;
  const busy = S.chat[S.chat.length - 1]?.t === THINKING;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* header */}
      <View style={{ paddingTop: ins.top + 8, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: BW, borderBottomColor: C.ink, backgroundColor: C.bg }}>
        <Avatar size={44} />
        <View style={{ flex: 1 }}>
          <T w="fun" size={24}>{COACH_NAME}</T>
          <Sub>{COACH_TAG} · AI</Sub>
        </View>
        <Pressable onPress={() => emit('guides')} accessibilityLabel="Guides" style={[{ height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', gap: 6 }, shadow]}>
          <Icon name="book" size={16} color={C.ink} /><T w="s" size={13}>Guides</T>
        </Pressable>
        <IconBtn name="info" label={`About ${COACH_NAME}`} onPress={() => emit('aiinfo')} />
      </View>

      {/* conversation */}
      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 20, gap: 12 }} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
        <View ref={tourRef('lara-chat')} collapsable={false} style={{ gap: 12 }}>
        <Bubble r="a" t={greeting()} />
        {empty ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginLeft: 36 }}>
          {STARTERS.map(([label, question]) => <Chip key={label} label={label} onPress={() => send(question)} />)}
          <Chip label="Something else" onPress={() => input.current?.focus()} />
        </View> : null}
        </View>
        {S.chat.map((m, k) => <Bubble key={k} r={m.r} t={m.t} src={m.src} />)}
        {!empty && !busy ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          <Chip label="Ask something else" onPress={() => input.current?.focus()} />
          <Chip label="New conversation" onPress={() => update(s => { s.chat = []; })} />
        </View> : null}
        <Sub style={{ textAlign: 'center', fontSize: 12, marginTop: 8 }}>{COACH_NAME} is an AI coach. General guidance, not medical advice.</Sub>
      </ScrollView>

      {/* composer */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12, backgroundColor: C.bg }}>
        <TextInput ref={input} value={q} onChangeText={setQ} multiline placeholder={`Message ${COACH_NAME}…`} placeholderTextColor={C.ink3}
          style={[{ flex: 1, maxHeight: 120, borderRadius: 24, backgroundColor: C.surface, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontFamily: F.r, fontSize: 15, color: C.ink }, outline]} />
        <Pressable onPress={() => send(q)} disabled={!q.trim() || busy} accessibilityLabel="Send" style={[{ width: 48, height: 48, borderRadius: 24, backgroundColor: q.trim() && !busy ? C.brand : C.surface, alignItems: 'center', justifyContent: 'center' }, outline, !(q.trim() && !busy) && { opacity: 0.4 }]}>
          <Icon name="send" color={q.trim() && !busy ? '#fff' : C.ink} />
        </Pressable>
      </View>
      <Sheet open={waiting !== null} onClose={() => answer(false)} title={`Before you ask ${COACH_NAME}`}>
        <Sub style={{ fontSize: 14, marginBottom: 12 }}>{`${COACH_NAME}'s answers are written by an AI service, Claude, made by Anthropic. To answer, the app sends it your question along with a short summary.`}</Sub>
        <Tip icon="shield" tone="water">
          <T w="s" size={14} color={C.waterInk}>What is sent</T>
          <T size={13} color={C.waterInk}>Your questions, your child's age range, the program step you're on, your setup quiz answers, and summary numbers like today's wins and the usual gap between wees.</T>
          <T w="s" size={14} color={C.waterInk} style={{ marginTop: 8 }}>What the app never adds</T>
          <T size={13} color={C.waterInk}>Your child's name, your email, photos or notes.</T>
        </Tip>
        <Btn title={`OK, ask ${COACH_NAME}`} onPress={() => answer(true)} />
        <Btn kind="text" title="No thanks, use the built-in guides" onPress={() => answer(false)} />
      </Sheet>
    </KeyboardAvoidingView>
  );
}
