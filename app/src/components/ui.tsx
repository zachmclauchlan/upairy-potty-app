import { ReactNode, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextProps, TextInput, TextInputProps, View, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { IconName } from './Icon';
import { C, F, R, shadow, TONES, Tone } from '@/lib/theme';

/* ---------- text ---------- */
type W = 'r' | 'm' | 's' | 'b' | 'fun';
export function T({ w = 'r', size = 15, color = C.ink, style, ...p }: TextProps & { w?: W; size?: number; color?: string }) {
  return <Text {...p} style={[{ fontFamily: F[w], fontSize: size, color, lineHeight: Math.round(size * 1.4) }, style]} />;
}
export const Label = ({ children, color = C.ink2, style }: { children: ReactNode; color?: string; style?: any }) =>
  <T w="s" size={12} color={color} style={[{ letterSpacing: 0.3, textTransform: 'uppercase' }, style]}>{children}</T>;
export const Sub = ({ children, style }: { children: ReactNode; style?: any }) => <T size={13} color={C.ink2} style={style}>{children}</T>;

/* ---------- layout ---------- */
export function Card({ children, style, pad = 18 }: { children: ReactNode; style?: StyleProp<ViewStyle>; pad?: number }) {
  return <View style={[{ backgroundColor: C.surface, borderRadius: R, padding: pad, marginBottom: 12 }, shadow, style]}>{children}</View>;
}
export function SectionHead({ title, right, onRight }: { title: string; right?: string; onRight?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 20, marginBottom: 10, marginHorizontal: 2 }}>
      <T w="s" size={17}>{title}</T>
      {right ? (onRight ? <Pressable onPress={onRight} hitSlop={10}><T w="s" size={13} color={C.brand}>{right}</T></Pressable> : <Sub>{right}</Sub>) : null}
    </View>
  );
}
export function Screen({ children, scrollRef }: { children: ReactNode; scrollRef?: any }) {
  const ins = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingTop: ins.top + 8, paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}
export function Header({ title, eyebrow, right }: { title: string; eyebrow: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6, marginBottom: 18, gap: 10 }}>
      <View style={{ flex: 1 }}>
        <T w="m" size={13} color={C.ink2}>{eyebrow}</T>
        <T w="b" size={30} style={{ letterSpacing: -0.6, lineHeight: 34 }} numberOfLines={1}>{title}</T>
      </View>
      {right}
    </View>
  );
}

/* ---------- controls ---------- */
export function Btn({ title, onPress, icon, kind = 'primary', style, small, disabled }: { title: string; onPress?: () => void; icon?: IconName; kind?: 'primary' | 'ghost' | 'white' | 'text'; style?: StyleProp<ViewStyle>; small?: boolean; disabled?: boolean }) {
  const bg = kind === 'primary' ? C.brand : kind === 'ghost' ? C.sunk : kind === 'white' ? '#fff' : 'transparent';
  const fg = kind === 'primary' ? '#fff' : kind === 'white' ? C.brandInk : kind === 'text' ? C.ink2 : C.ink;
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={({ pressed }) => [{ height: small ? 46 : 54, borderRadius: 16, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}>
      {icon ? <Icon name={icon} color={fg} /> : null}
      <T w="s" size={small ? 15 : 16} color={fg}>{title}</T>
    </Pressable>
  );
}
export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, backgroundColor: on ? C.ink : C.surface, borderWidth: 1.5, borderColor: on ? C.ink : C.line }}>
      <T w="s" size={13} color={on ? '#fff' : C.ink}>{label}</T>
    </Pressable>
  );
}
export const Chips = ({ children, style }: { children: ReactNode; style?: any }) => <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, style]}>{children}</View>;
export function Opt({ label, icon, on, onPress, warn }: { label: string; icon?: IconName; on?: boolean; onPress?: () => void; warn?: boolean }) {
  const onBg = warn ? C.accSoft : C.brandSoft, onBd = warn ? C.acc : C.brand, onFg = warn ? C.accInk : C.brandInk;
  return (
    <Pressable onPress={onPress} style={{ flex: 1, borderRadius: 14, backgroundColor: on ? onBg : C.surface, borderWidth: 1.5, borderColor: on ? onBd : C.line, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center', gap: 6 }}>
      {icon ? <Icon name={icon} color={on ? onFg : C.ink} /> : null}
      <T w="s" size={14} color={on ? onFg : C.ink} style={{ textAlign: 'center' }}>{label}</T>
    </Pressable>
  );
}
export function Badge({ label, icon, tone = 'ok', onPress }: { label: string; icon?: IconName; tone?: 'ok' | 'grey' | 'blue' | 'white'; onPress?: () => void }) {
  const t = { ok: [C.brandSoft, C.brandInk], grey: [C.sunk, C.ink2], blue: [C.waterSoft, C.waterInk], white: ['rgba(255,255,255,.18)', '#fff'] }[tone];
  const inner = <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t[0], paddingVertical: 4, paddingHorizontal: 9, borderRadius: 99, alignSelf: 'flex-start' }}>
    {icon ? <Icon name={icon} size={13} color={t[1]} /> : null}<T w="s" size={11} color={t[1]} style={{ lineHeight: 15 }}>{label}</T></View>;
  return onPress ? <Pressable onPress={onPress} hitSlop={6}>{inner}</Pressable> : inner;
}
export function IconBox({ name, tone, size = 38, round, iconSize }: { name: IconName; tone: Tone; size?: number; round?: boolean; iconSize?: number }) {
  return <View style={{ width: size, height: size, borderRadius: round ? size / 2 : 12, backgroundColor: TONES[tone].bg, alignItems: 'center', justifyContent: 'center' }}><Icon name={name} size={iconSize ?? Math.round(size * 0.47)} color={TONES[tone].fg} /></View>;
}
export function Meter({ pct, color = C.brand, track = C.sunk, style }: { pct: number; color?: string; track?: string; style?: any }) {
  return <View style={[{ height: 6, backgroundColor: track, borderRadius: 9, overflow: 'hidden' }, style]}><View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', backgroundColor: color, borderRadius: 9 }} /></View>;
}
export function Toggle({ on }: { on: boolean }) {
  return <View style={{ width: 46, height: 28, borderRadius: 99, backgroundColor: on ? C.brand : '#D3D0C8', padding: 3, alignItems: on ? 'flex-end' : 'flex-start' }}><View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' }} /></View>;
}
/** A tappable list row with icon, title, subtitle and chevron. */
export function Row({ icon, tone = 'ok', title, sub, onPress, right, first, danger }: { icon?: IconName; tone?: Tone; title: string; sub?: string; onPress?: () => void; right?: ReactNode; first?: boolean; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderTopWidth: first ? 0 : 1, borderTopColor: C.line }}>
      {icon ? <IconBox name={icon} tone={tone} size={42} /> : null}
      <View style={{ flex: 1 }}>
        <T w="s" size={14} color={danger ? C.acc : C.ink}>{title}</T>
        {sub ? <T size={12} color={C.ink2}>{sub}</T> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevR" size={18} color={C.ink3} /> : null)}
    </Pressable>
  );
}
export function Input(p: TextInputProps & { label?: string }) {
  const { label, style, ...rest } = p;
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Label style={{ marginBottom: 6, marginLeft: 2 }}>{label}</Label> : null}
      <TextInput placeholderTextColor={C.ink3} {...rest} style={[{ borderRadius: 14, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.surface, padding: 14, fontFamily: F.r, fontSize: 16, color: C.ink }, style]} />
    </View>
  );
}
export function Tip({ icon = 'bulb', children, tone = 'ok' }: { icon?: IconName; children: ReactNode; tone?: 'ok' | 'water' | 'poo' | 'sun' }) {
  const t = { ok: [C.brandSoft, C.brandInk], water: [C.waterSoft, C.waterInk], poo: [C.pooSoft, C.ink], sun: [C.sunSoft, C.ink] }[tone];
  return <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: 18, backgroundColor: t[0], marginBottom: 12 }}><Icon name={icon} color={t[1]} /><View style={{ flex: 1 }}>{typeof children === 'string' ? <T size={14} color={t[1]}>{children}</T> : children}</View></View>;
}

/* ---------- bottom sheet ---------- */
export function Sheet({ open, onClose, title, left, right, children }: { open: boolean; onClose: () => void; title?: string; left?: ReactNode; right?: ReactNode; children: ReactNode }) {
  const ins = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}><View style={{ flex: 1, backgroundColor: 'rgba(15,17,20,.38)' }} /></Pressable>
        <View style={{ marginTop: 'auto', maxHeight: '90%', backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
          <View style={{ width: 38, height: 5, borderRadius: 9, backgroundColor: '#D3D0C8', alignSelf: 'center', marginTop: 10, marginBottom: 12 }} />
          {title ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 }}>
              <View style={{ minWidth: 60 }}>{left}</View>
              <T w="s" size={18} style={{ flex: 1, textAlign: 'center' }} numberOfLines={1}>{title}</T>
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
    <Animated.View pointerEvents={m ? 'auto' : 'none'} style={{ position: 'absolute', left: 16, right: 16, bottom: ins.bottom + 76, opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }], backgroundColor: C.ink, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}>
        <T w="m" size={14} color="#fff">{shown.title}</T>
        {shown.sub ? <T size={12} color="rgba(255,255,255,.65)">{shown.sub}</T> : null}
      </View>
      {shown.undo ? <Pressable onPress={() => { shown.undo?.(); toastMsg = null; toastL.forEach(l => l()); }} hitSlop={10}><T w="s" color="#9DD68F">Undo</T></Pressable> : null}
    </Animated.View>
  );
}
