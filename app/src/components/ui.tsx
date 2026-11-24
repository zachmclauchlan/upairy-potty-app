import { ReactNode, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextProps, TextInput, TextInputProps, View, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { IconName } from './Icon';
import { BW, C, F, R, outline, shadow, TONES, Tone } from '@/lib/theme';
import { registerScroller } from '@/lib/tour';

/* ---------- text ---------- */
type W = 'r' | 'm' | 's' | 'b' | 'fun';
// Android clips text whose line height is below the font's own height, so T always enforces a
// minimum: roomy for reading sizes, tighter for display sizes.
const minLine = (fs: number) => Math.ceil(fs * (fs <= 17 ? 1.45 : 1.25));
/** Titles and big numbers (semi-bold from 20px up) are set in Chewy, the hand-drawn display face. */
const DISPLAY_FROM = 20;
export function T({ w = 'r', size = 15, color = C.ink, style, ...p }: TextProps & { w?: W; size?: number; color?: string }) {
  const flat = (StyleSheet.flatten(style) || {}) as { fontSize?: number; lineHeight?: number };
  const fs = flat.fontSize ?? size;
  const display = w === 'fun' || ((w === 's' || w === 'b') && fs >= DISPLAY_FROM);
  const lineHeight = Math.max(flat.lineHeight ?? 0, minLine(fs));
  return <Text {...p} style={[{ fontFamily: display ? F.fun : F[w], fontSize: size, color }, Platform.OS === 'android' && { includeFontPadding: false }, style, { lineHeight }, display && { letterSpacing: 0 }]} />;
}
export const Label = ({ children, color = C.ink2, style }: { children: ReactNode; color?: string; style?: any }) =>
  <T w="s" size={13} color={color} style={style}>{children}</T>;
export const Sub = ({ children, style }: { children: ReactNode; style?: any }) => <T size={13} color={C.ink2} style={style}>{children}</T>;

/* ---------- layout ---------- */
export function Card({ children, style, pad = 20 }: { children: ReactNode; style?: StyleProp<ViewStyle>; pad?: number }) {
  return <View style={[{ backgroundColor: C.surface, borderRadius: R, padding: pad, marginBottom: 16 }, shadow, style]}>{children}</View>;
}
export function SectionHead({ title, right, onRight }: { title: string; right?: string; onRight?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 16, marginBottom: 8, gap: 12 }}>
      <T w="fun" size={22} style={{ flexShrink: 1 }}>{title}</T>
      {right ? (onRight ? <Pressable onPress={onRight} hitSlop={10}><T w="s" size={13} color={C.brandInk}>{right}</T></Pressable> : <Sub>{right}</Sub>) : null}
    </View>
  );
}
export function Screen({ children, scrollRef, tour }: { children: ReactNode; scrollRef?: any; tour?: string }) {
  const ins = useSafeAreaInsets();
  const own = useRef<any>(null); const ref = scrollRef ?? own; const y = useRef(0);
  // lets the guided tour scroll this screen to whatever it's pointing at
  useEffect(() => tour ? registerScroller(tour, { scrollTo: v => ref.current?.scrollTo?.({ y: Math.max(0, v), animated: true }), y: () => y.current }) : undefined, [tour, ref]);
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView ref={ref} onScroll={e => { y.current = e.nativeEvent.contentOffset.y; }} scrollEventThrottle={32} contentContainerStyle={{ paddingTop: ins.top + 12, paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}
export function Header({ title, eyebrow, right }: { title: string; eyebrow: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4, marginBottom: 16, gap: 12 }}>
      <View style={{ flex: 1 }}>
        <T size={13} color={C.ink2}>{eyebrow}</T>
        <T w="fun" size={36} numberOfLines={1} adjustsFontSizeToFit>{title}</T>
      </View>
      {right}
    </View>
  );
}
/** A round outlined icon button, like the share button in the header. */
export function IconBtn({ name, onPress, label, size = 40 }: { name: IconName; onPress?: () => void; label: string; size?: number }) {
  return <Pressable onPress={onPress} accessibilityLabel={label} style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }, shadow, pressed && PRESSED]}><Icon name={name} size={18} color={C.ink} /></Pressable>;
}
/** Two or three choices in one outlined bar. */
export function Seg<V extends string | boolean>({ value, onChange, options, style }: { value: V; onChange: (v: V) => void; options: readonly (readonly [V, IconName, string])[]; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', backgroundColor: C.surface, borderRadius: 22, padding: 3, marginBottom: 16 }, shadow, style]}>
    {options.map(([v, ic, l]) => { const on = value === v; return (
      <Pressable key={l} onPress={() => onChange(v)} style={{ flex: 1, height: 34, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: on ? C.hi : 'transparent' }}>
        <Icon name={ic} size={16} color={on ? C.ink : C.ink2} /><T w={on ? 's' : 'm'} size={14} color={on ? C.ink : C.ink2}>{l}</T>
      </Pressable>); })}
  </View>;
}

/* ---------- controls ---------- */
// A pressed sticker sinks onto its shadow.
const PRESSED = { transform: [{ translateY: 3 }], boxShadow: `0px 0px 0px ${C.ink}` };
export function Btn({ title, onPress, icon, kind = 'primary', style, small, disabled }: { title: string; onPress?: () => void; icon?: IconName; kind?: 'primary' | 'ghost' | 'white' | 'text'; style?: StyleProp<ViewStyle>; small?: boolean; disabled?: boolean }) {
  const text = kind === 'text';
  const bg = kind === 'primary' ? C.brand : text ? 'transparent' : C.surface;
  const fg = kind === 'primary' ? '#fff' : text ? C.ink2 : C.ink;
  const h = small ? 44 : 56;
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={({ pressed }) => [{ height: text ? 48 : h, borderRadius: h / 2, paddingHorizontal: 20, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: disabled ? 0.45 : 1 }, !text && shadow, pressed && !disabled && (text ? { opacity: 0.6 } : PRESSED), style]}>
      {icon ? <Icon name={icon} color={fg} stroke={2.2} /> : null}
      {text ? <T w="s" size={15} color={fg}>{title}</T> : <T w="fun" size={small ? 18 : 21} color={fg}>{title}</T>}
    </Pressable>
  );
}
export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 99, backgroundColor: on ? C.hi : C.surface }, outline]}>
      <T w="s" size={13}>{label}</T>
    </Pressable>
  );
}
export const Chips = ({ children, style }: { children: ReactNode; style?: any }) => <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, style]}>{children}</View>;
export function Opt({ label, icon, on, onPress, warn }: { label: string; icon?: IconName; on?: boolean; onPress?: () => void; warn?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[{ flex: 1, borderRadius: 16, backgroundColor: on ? (warn ? C.accSoft : C.brandSoft) : C.surface, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', gap: 6 }, on ? shadow : outline]}>
      {icon ? <Icon name={icon} color={C.ink} /> : null}
      <T w="s" size={14} style={{ textAlign: 'center' }}>{label}</T>
    </Pressable>
  );
}
export function Badge({ label, icon, tone = 'ok', onPress }: { label: string; icon?: IconName; tone?: 'ok' | 'grey' | 'blue' | 'white'; onPress?: () => void }) {
  const bg = { ok: C.brandSoft, grey: C.surface, blue: C.waterSoft, white: C.surface }[tone];
  const inner = <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: bg, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 99, alignSelf: 'flex-start', borderWidth: 1.5, borderColor: C.ink }}>
    {icon ? <Icon name={icon} size={13} color={C.ink} /> : null}<T w="s" size={12}>{label}</T></View>;
  return onPress ? <Pressable onPress={onPress} hitSlop={6}>{inner}</Pressable> : inner;
}
/** A quiet text action with an optional icon, for the secondary things in a card. */
export function Link({ label, icon, after, onPress, color = C.ink2 }: { label: string; icon?: IconName; after?: IconName; onPress?: () => void; color?: string }) {
  return <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: pressed ? 0.6 : 1 })}>
    {icon ? <Icon name={icon} size={14} color={color} /> : null}<T w="m" size={13} color={color}>{label}</T>{after ? <Icon name={after} size={14} color={color} /> : null}
  </Pressable>;
}
/** An icon as a sticker: ink on its pastel, with an ink outline. */
export function IconBox({ name, tone, size = 36, iconSize }: { name: IconName; tone: Tone; size?: number; round?: boolean; iconSize?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: TONES[tone].bg, alignItems: 'center', justifyContent: 'center', borderWidth: size < 32 ? 1.5 : BW, borderColor: C.ink }}><Icon name={name} size={iconSize ?? Math.round(size * 0.47)} color={C.ink} /></View>;
}
export function Meter({ pct, color = C.brand, track = C.surface, style }: { pct: number; color?: string; track?: string; style?: any }) {
  return <View style={[{ height: 12, backgroundColor: track, borderRadius: 6, overflow: 'hidden', borderWidth: 1.5, borderColor: C.ink }, style]}><View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', backgroundColor: color }} /></View>;
}
export function Toggle({ on }: { on: boolean }) {
  return <View style={[{ width: 48, height: 28, borderRadius: 14, backgroundColor: on ? C.brand : C.surface, padding: 2, alignItems: on ? 'flex-end' : 'flex-start' }, outline]}><View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: on ? '#fff' : C.ink }} /></View>;
}
/** A tappable list row with icon, title, subtitle and chevron. */
export function Row({ icon, tone = 'ok', title, sub, onPress, right, first, danger }: { icon?: IconName; tone?: Tone; title: string; sub?: string; onPress?: () => void; right?: ReactNode; first?: boolean; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: first ? 0 : 1, borderTopColor: C.line }}>
      {icon ? <IconBox name={icon} tone={tone} /> : null}
      <View style={{ flex: 1 }}>
        <T w="s" size={15} color={danger ? C.acc : C.ink}>{title}</T>
        {sub ? <T size={13} color={C.ink2}>{sub}</T> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevR" size={16} color={C.ink3} /> : null)}
    </Pressable>
  );
}
export function Input(p: TextInputProps & { label?: string }) {
  const { label, style, ...rest } = p;
  return (
    <View style={{ marginBottom: 16 }}>
      {label ? <Label style={{ marginBottom: 6 }}>{label}</Label> : null}
      <TextInput placeholderTextColor={C.ink3} {...rest} style={[{ borderRadius: 16, backgroundColor: C.surface, paddingVertical: 12, paddingHorizontal: 16, fontFamily: F.r, fontSize: 16, color: C.ink }, outline, style]} />
    </View>
  );
}
export function Tip({ icon = 'bulb', children, tone = 'ok' }: { icon?: IconName; children: ReactNode; tone?: 'ok' | 'water' | 'poo' | 'sun' }) {
  const bg = { ok: C.brandSoft, water: C.waterSoft, poo: C.pooSoft, sun: C.sunSoft }[tone];
  return <View style={[{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 16, borderRadius: 16, backgroundColor: bg, marginBottom: 16 }, outline]}><Icon name={icon} color={C.ink} /><View style={{ flex: 1 }}>{typeof children === 'string' ? <T size={14}>{children}</T> : children}</View></View>;
}

/* ---------- bottom sheet ---------- */
export function Sheet({ open, onClose, title, left, right, children }: { open: boolean; onClose: () => void; title?: string; left?: ReactNode; right?: ReactNode; children: ReactNode }) {
  const ins = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}><View style={{ flex: 1, backgroundColor: 'rgba(15,17,20,.38)' }} /></Pressable>
        <View style={{ marginTop: 'auto', maxHeight: '90%', backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: BW, borderBottomWidth: 0, borderColor: C.ink }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.ink, opacity: 0.25, alignSelf: 'center', marginTop: 12, marginBottom: 12 }} />
          {title ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 }}>
              <View style={{ minWidth: 60 }}>{left}</View>
              <T w="fun" size={22} style={{ flex: 1, textAlign: 'center' }} numberOfLines={1}>{title}</T>
              <View style={{ minWidth: 60, alignItems: 'flex-end' }}>{right ?? <Pressable onPress={onClose} hitSlop={10}><T w="s" color={C.ink2}>Done</T></Pressable>}</View>
            </View>
          ) : null}
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: ins.bottom + 24 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
export const SheetLink = ({ label, onPress, color = C.ink2 }: { label: string; onPress: () => void; color?: string }) =>
  <Pressable onPress={onPress} hitSlop={10}><T w="s" color={color}>{label}</T></Pressable>;

/* ---------- confirm dialog ---------- */
export function confirmAsk(title: string, msg: string, okLabel: string, onOk: () => void, cancelLabel = 'Cancel') {
  if (Platform.OS === 'web') { if (globalThis.confirm?.(title + '\n\n' + msg)) onOk(); return; }
  Alert.alert(title, msg, [{ text: cancelLabel, style: 'cancel' }, { text: okLabel, onPress: onOk }]);
}

/* ---------- toast (global) ---------- */
type ToastMsg = { title: string; sub?: string; undo?: () => void; id: number } | null;
let toastMsg: ToastMsg = null; const toastL = new Set<() => void>(); let toastTimer: any;
export function toast(title: string, sub?: string, undo?: () => void) {
  toastMsg = { title, sub, undo, id: Date.now() }; toastL.forEach(l => l());
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastMsg = null; toastL.forEach(l => l()); }, 3800);
}
export function ToastHost() {
  const m = useSyncExternalStore(l => { toastL.add(l); return () => { toastL.delete(l); }; }, () => toastMsg, () => toastMsg);
  const ins = useSafeAreaInsets();
  const a = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState<ToastMsg>(null);
  useEffect(() => { if (m) setShown(m); Animated.timing(a, { toValue: m ? 1 : 0, duration: 220, useNativeDriver: Platform.OS !== 'web' }).start(); }, [m]);
  if (!shown) return null;
  return (
    <Animated.View pointerEvents={m ? 'auto' : 'none'} style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(ins.bottom, 8) + 82, opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }], backgroundColor: C.ink, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}>
        <T w="m" size={14} color="#fff">{shown.title}</T>
        {shown.sub ? <T size={12} color="rgba(255,255,255,.65)">{shown.sub}</T> : null}
      </View>
      {shown.undo ? <Pressable onPress={() => { shown.undo?.(); toastMsg = null; toastL.forEach(l => l()); }} hitSlop={10}><T w="s" color="#9DD68F">Undo</T></Pressable> : null}
    </Animated.View>
  );
}
