import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Line icons from the prototype, drawn on a 24px grid.
const P: Record<string, (c: string) => React.ReactNode> = {
  drop: () => <Path d="M12 3.2c3.2 3.9 6.2 7.2 6.2 10.8a6.2 6.2 0 0 1-12.4 0c0-3.6 3-6.9 6.2-10.8z" />,
  poo: () => <Path d="M7.5 19.5h9a3 3 0 0 0 .6-5.9 2.6 2.6 0 0 0-2.2-3.9 2.2 2.2 0 0 0-2.6-2.9c.4 1.1-.8 2-1.9 2.4a2.6 2.6 0 0 0-1.6 4.4 3 3 0 0 0-1.3 5.9z" />,
  cup: () => <><Path d="M6 4h12l-1.4 14.6a2 2 0 0 1-2 1.9H9.4a2 2 0 0 1-2-1.9z" /><Path d="M6.6 9.5h10.8" /></>,
  meal: () => <><Path d="M7 3v7m-2.2-7v4.6a2.2 2.2 0 0 0 4.4 0V3M7 10.5V21" /><Path d="M17.5 21V3c-2 1.2-3 3.5-3 6.5 0 2 1 3 3 3" /></>,
  sun: () => <><Circle cx="12" cy="12" r="4" /><Path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
  moon: () => <Path d="M19.5 14.6A8 8 0 1 1 9.4 4.5a6.4 6.4 0 0 0 10.1 10.1z" />,
  sunrise: () => <><Path d="M5 18a7 7 0 0 1 14 0" /><Path d="M3 21h18M12 3v5m-3-2 3-3 3 3" /></>,
  clock: () => <><Circle cx="12" cy="12" r="8.5" /><Path d="M12 7.5V12l3 2" /></>,
  check: () => <Path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: () => <Path d="M6 6l12 12M18 6 6 18" />,
  plus: () => <Path d="M12 5v14M5 12h14" />,
  hour: () => <Path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" />,
  share: () => <><Path d="M12 15V3.5m0 0L8 7.5m4-4 4 4" /><Path d="M7 11H5.5A1.5 1.5 0 0 0 4 12.5v6A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5H17" /></>,
  home: () => <Path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19z" />,
  cal: () => <><Rect x="3.5" y="5" width="17" height="15.5" rx="3" /><Path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  chart: () => <><Path d="M4 20h16" /><Rect x="5.5" y="11" width="3" height="6" rx="1" /><Rect x="10.5" y="6" width="3" height="11" rx="1" /><Rect x="15.5" y="13.5" width="3" height="3.5" rx="1" /></>,
  book: () => <Path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" />,
  route: () => <><Circle cx="6" cy="18" r="2.2" /><Circle cx="18" cy="6" r="2.2" /><Path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8" /></>,
  chevR: () => <Path d="m9 5 7 7-7 7" />,
  chevL: () => <Path d="m15 5-7 7 7 7" />,
  chevD: () => <Path d="m6 9 6 6 6-6" />,
  bulb: () => <Path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2v.1h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />,
  speak: () => <><Path d="M5 18.5V6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H9z" /><Path d="M9 9.5h6M9 12h3.5" /></>,
  trash: () => <Path d="M5 7h14M10 11v6M14 11v6M6.5 7l1 12a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4l1-12M9.5 7V4.5h5V7" />,
  car: () => <><Path d="M5 16.5V12l1.8-4.6A2 2 0 0 1 8.7 6h6.6a2 2 0 0 1 1.9 1.4L19 12v4.5" /><Path d="M4 12h16v4.5H4z" /><Circle cx="7.5" cy="18" r="1.5" /><Circle cx="16.5" cy="18" r="1.5" /></>,
  heart: () => <Path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z" />,
  bed: () => <><Path d="M3 19v-9M21 19v-4.5a3 3 0 0 0-3-3h-8V15H3M3 15h18" /><Circle cx="6.5" cy="12" r="1.8" /></>,
  copy: () => <><Rect x="8" y="8" width="12" height="12" rx="2.5" /><Path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" /></>,
  users: () => <><Circle cx="9" cy="8" r="3.2" /><Path d="M3 19.5a6 6 0 0 1 12 0M16 4.9a3.2 3.2 0 0 1 0 6.2M21 19.5a6 6 0 0 0-3.5-5.4" /></>,
  bolt: () => <Path d="M13 3 5 13.5h6l-1 7.5 8-10.5h-6z" />,
  leaf: () => <><Path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><Path d="M5 19c3-4 6-6.5 10-8.5" /></>,
  spark: () => <Path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  replay: () => <><Path d="M4 12a8 8 0 1 0 2.4-5.7" /><Path d="M4 4v4.5h4.5" /></>,
  pause: () => <><Rect x="6.5" y="5" width="3.5" height="14" rx="1" /><Rect x="14" y="5" width="3.5" height="14" rx="1" /></>,
  info: () => <><Circle cx="12" cy="12" r="8.5" /><Path d="M12 11v5M12 8h.01" /></>,
  music: () => <><Path d="M9 18V5.5l10-2V16" /><Circle cx="6.5" cy="18" r="2.5" /><Circle cx="16.5" cy="16" r="2.5" /></>,
  send: () => <><Path d="M4 12 20 4l-6 16-3-7z" /><Path d="m11 13 9-9" /></>,
  gift: () => <><Rect x="3.5" y="9" width="17" height="11.5" rx="2" /><Path d="M3.5 13h17M12 9v11.5M12 9C10 5 6.5 5.5 7 7.5S12 9 12 9zm0 0c2-4 5.5-3.5 5-1.5S12 9 12 9z" /></>,
  shield: () => <><Path d="M12 3 5 6v5.5c0 4.3 3 7.7 7 9.5 4-1.8 7-5.2 7-9.5V6z" /><Path d="m9 12 2.2 2.2L15.5 10" /></>,
  key: () => <><Circle cx="8" cy="15" r="4" /><Path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2" /></>,
  bell: () => <><Path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><Path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  download: () => <Path d="M12 4v11m0 0-4-4m4 4 4-4M5 19.5h14" />,
  star: () => <Path d="M12 3.2l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.6l6-.9z" />,
  smile: () => <><Circle cx="12" cy="12" r="8.5" /><Path d="M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01" /></>,
  chat: () => <><Path d="M4 18.5V7a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 7v7a2.5 2.5 0 0 1-2.5 2.5H8z" /><Path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" /></>,
  bag: () => <><Path d="M5 8h14l-1 12.5H6z" /><Path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
};
export type IconName = keyof typeof P;

export default function Icon({ name, size = 20, color = 'currentColor', stroke = 1.8, fill = 'none' }: { name: IconName; size?: number; color?: string; stroke?: number; fill?: string }) {
  const draw = P[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {draw ? draw(color) : null}
    </Svg>
  );
}
