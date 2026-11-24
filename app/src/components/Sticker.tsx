import Svg, { Circle, G, Path } from 'react-native-svg';
import { C } from '@/lib/theme';
import { STKC } from '@/lib/content';

// Stickers: simple shapes drawn in code, so there are no image assets to license.
// Sticker i always has the same shape and colour, so the chart and the Today strip match.
export default function Sticker({ i, size = '70%' }: { i: number; size?: number | `${number}%` }) {
  const c = STKC[(i * 5 + Math.floor(i / 6)) % STKC.length];
  const k = i % 6;
  const ink = { stroke: C.ink, strokeWidth: 1.4, strokeLinejoin: 'round' as const };
  return <Svg width={size} height={size} viewBox="0 0 24 24">
    {k === 0 ? <Path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" fill={c} {...ink} /> :
     k === 1 ? <Path d="M12 21s-8-4.7-8-10.7A4.6 4.6 0 0 1 12 7.6a4.6 4.6 0 0 1 8 2.7C20 16.3 12 21 12 21z" fill={c} {...ink} /> :
     k === 2 ? <G><Path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" stroke={C.ink} strokeWidth={1.8} strokeLinecap="round" /><Circle cx="12" cy="12" r="5" fill={c} {...ink} /></G> :
     k === 3 ? <Path d="M12 3.5c3.2 3.9 6.2 7.2 6.2 10.8a6.2 6.2 0 0 1-12.4 0c0-3.6 3-6.9 6.2-10.8z" fill={c} {...ink} /> :
     k === 4 ? <G><Circle cx="12" cy="7" r="3.6" fill={c} {...ink} /><Circle cx="7" cy="12" r="3.6" fill={c} {...ink} /><Circle cx="17" cy="12" r="3.6" fill={c} {...ink} /><Circle cx="12" cy="17" r="3.6" fill={c} {...ink} /><Circle cx="12" cy="12" r="2.8" fill="#fff" {...ink} /></G> :
     <Path d="M19.5 14.6A8 8 0 1 1 9.4 4.5a6.4 6.4 0 0 0 10.1 10.1z" fill={c} {...ink} />}
  </Svg>;
}
