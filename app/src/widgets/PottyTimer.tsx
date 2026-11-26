// The potty timer on the iPhone lock screen and in the Dynamic Island (a "Live Activity").
// The countdown runs on its own from the two times passed in, so it keeps moving while the
// app is closed. Started and updated from lib/lockTimer.ts.
// The buttons open the app and log straight away (see lib/quickLog.ts): iOS only lets a lock-screen
// button run app code by opening the app, so the phone asks for Face ID first if it is locked.
//
// Everything inside the function runs in a separate little runtime in the widget extension: it can only
// use the SwiftUI pieces imported here and its props. No hooks, no app state, nothing from outside the function.
import { HStack, Image, Link, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, font, frame, monospacedDigit, multilineTextAlignment, padding, tint } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity } from 'expo-widgets';

export type PottyTimerProps = {
  /** e.g. "Mia's next potty try" */
  title: string;
  /** e.g. "at 10:43 AM" */
  at: string;
  /** when this countdown started and when the try is due, in milliseconds */
  start: number;
  due: number;
  /** the app's own link address, e.g. "upairypotty://" */
  link: string;
};

const PottyTimer = (props: PottyTimerProps) => {
  'widget';
  const green = '#3E7F33';
  const range = { lower: new Date(props.start), upper: new Date(props.due) };
  // k marks which countdown the tap belongs to, so the same tap is never logged twice.
  const to = (what: string) => `${props.link}?log=${what}&k=${props.due}`;
  // The lock screen gives this about 160pt of height, so: one line of title, the countdown, one row of buttons.
  const btn = (first: boolean) => [buttonStyle(first ? 'borderedProminent' : 'bordered'), controlSize('small'), tint(green), font({ size: 14, weight: 'semibold' })];
  const buttons = (
    <HStack spacing={8}>
      <Link label="Wee" destination={to('wee')} modifiers={btn(true)} />
      <Link label="Poo" destination={to('poo')} modifiers={btn(false)} />
      <Link label="Nothing" destination={to('nothing')} modifiers={btn(false)} />
      <Link label="Accident" destination={to('accident')} modifiers={btn(false)} />
      <Spacer />
    </HStack>
  );
  return {
    banner: (
      <VStack alignment="leading" spacing={6} modifiers={[padding({ all: 14 })]}>
        <HStack spacing={6}>
          <Image systemName="toilet.fill" color={green} size={15} />
          <Text modifiers={[font({ size: 15, weight: 'semibold' })]}>{props.title}</Text>
          <Spacer />
          <Text modifiers={[font({ size: 13 })]}>{props.at}</Text>
        </HStack>
        <Text timerInterval={range} countsDown modifiers={[font({ size: 34, weight: 'bold', design: 'rounded' }), monospacedDigit()]} />
        {buttons}
      </VStack>
    ),
    // In the Dynamic Island a countdown takes all the width it can get unless it is given a fixed one.
    compactLeading: <Image systemName="toilet.fill" color={green} size={14} />,
    compactTrailing: <Text timerInterval={range} countsDown modifiers={[font({ size: 14, weight: 'semibold' }), monospacedDigit(), multilineTextAlignment('trailing'), frame({ width: 44 })]} />,
    minimal: <Image systemName="toilet.fill" color={green} size={14} />,
    expandedLeading: (
      <VStack modifiers={[padding({ all: 8 })]}>
        <Image systemName="toilet.fill" color={green} size={22} />
      </VStack>
    ),
    expandedTrailing: (
      <VStack modifiers={[padding({ all: 8 })]}>
        <Text timerInterval={range} countsDown modifiers={[font({ size: 24, weight: 'bold', design: 'rounded' }), monospacedDigit(), multilineTextAlignment('trailing'), frame({ width: 76 })]} />
      </VStack>
    ),
    expandedBottom: (
      <VStack alignment="leading" spacing={6} modifiers={[padding({ all: 8 })]}>
        <Text modifiers={[font({ size: 14, weight: 'semibold' })]}>{`${props.title} ${props.at}`}</Text>
        {buttons}
      </VStack>
    ),
  };
};

export default createLiveActivity('PottyTimer', PottyTimer);
