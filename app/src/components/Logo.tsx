import { Image } from 'react-native';

// The UpAiry wordmark. Files are generated from assets/brand/upairy-wordmark.png by scripts/make-icons.py.
const SRC = {
  green: require('../../assets/brand/logo-green.png'),
  white: require('../../assets/brand/logo-white.png'),
  black: require('../../assets/brand/logo-black.png'),
};
const RATIO = 284 / 946; // height / width of the cropped wordmark

export default function Logo({ width = 120, color = 'green', style }: { width?: number; color?: keyof typeof SRC; style?: any }) {
  return <Image source={SRC[color]} accessibilityLabel="UpAiry" style={[{ width, height: Math.round(width * RATIO) }, style]} resizeMode="contain" />;
}
