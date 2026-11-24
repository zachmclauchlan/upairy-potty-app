import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { T } from './ui';
import Icon from './Icon';
import { C, shadow } from '@/lib/theme';
import { S } from '@/lib/store';

/** The child's name in the top corner. Opens Settings. */
export default function KidChip() {
  return (
    <Pressable onPress={() => router.push('/settings')} accessibilityLabel="Settings" style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, paddingLeft: 5, paddingRight: 10, borderRadius: 99, backgroundColor: C.surface }, shadow]}>
      <T w="b" size={13} color={C.brandInk} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: C.brandSoft, textAlign: 'center', lineHeight: 30, overflow: 'hidden' }}>{(S.child.name[0] || '?').toUpperCase()}</T>
      <T w="s" size={14}>{S.child.name}</T>
      <Icon name="chevR" size={16} color={C.ink2} />
    </Pressable>
  );
}
