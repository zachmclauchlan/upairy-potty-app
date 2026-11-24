import { Pressable, View } from 'react-native';
import { tourRef } from '@/lib/tour';
import { router } from 'expo-router';
import { T } from './ui';
import Icon from './Icon';
import { C, shadow } from '@/lib/theme';
import { S } from '@/lib/store';

/** The child's name in the top corner. Opens Settings. */
export default function KidChip({ tour }: { tour?: string }) {
  const chip = (
    <Pressable onPress={() => router.push('/settings')} accessibilityLabel="Settings" style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 40, paddingLeft: 16, paddingRight: 10, borderRadius: 20, backgroundColor: C.surface }, shadow]}>
      <T w="s" size={14} numberOfLines={1} style={{ maxWidth: 96 }}>{S.child.name}</T>
      <Icon name="chevR" size={14} color={C.ink2} />
    </Pressable>
  );
  return tour ? <View ref={tourRef(tour)} collapsable={false}>{chip}</View> : chip;
}
