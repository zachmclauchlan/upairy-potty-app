import { Pressable, View } from 'react-native';
import { T, IconBox } from './ui';
import Icon, { IconName } from './Icon';
import { C } from '@/lib/theme';
import { type Ev, sod } from '@/lib/store';
import { dur, evMeta, fmt, isWee } from '@/lib/logic';
import { removeEvent } from '@/lib/actions';

export default function Timeline({ list, del }: { list: Ev[]; del?: boolean }) {
  return <>{list.map((e, i) => {
    const m = evMeta(e);
    const next = list.slice(i + 1).find(isWee);
    const gap = isWee(e) && next && sod(next.ts) === sod(e.ts) ? dur(e.ts - next.ts) : null;
    return (
      <View key={e.id}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
          <IconBox name={m.ic as IconName} tone={m.tone} size={38} iconSize={18} />
          <View style={{ flex: 1 }}><T w="s" size={14}>{m.t}</T>{m.s ? <T size={12} color={C.ink2}>{m.s}{e.late ? ' · added later' : ''}</T> : null}</View>
          <T size={13} color={C.ink2}>{fmt(e.ts)}</T>
          {del ? <Pressable onPress={() => removeEvent(e.id)} hitSlop={10} style={{ padding: 4 }}><Icon name="x" size={16} color={C.ink3} /></Pressable> : null}
        </View>
        {gap ? <T size={11} color={C.ink3} style={{ marginLeft: 50, marginTop: -6, marginBottom: -2 }}>{gap} since the last wee</T> : null}
      </View>
    );
  })}</>;
}
