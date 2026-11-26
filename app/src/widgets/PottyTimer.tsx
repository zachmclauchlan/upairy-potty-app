// The potty timer on the iPhone lock screen and in the Dynamic Island (a "Live Activity").
// The countdown and the bar run on their own from the two times passed in, so they keep moving while the
// app is closed. Started and updated from lib/lockTimer.ts.
// The three buttons open the app and log straight away (see lib/quickLog.ts): iOS only lets a lock-screen
// button run app code by opening the app, so the phone asks for Face ID first if it is locked.
//
// Everything inside the function runs in a separate little runtime in the widget extension: it can only
// use the SwiftUI pieces imported here and its props. No hooks, no app state, nothing from outside the function.
import { HStack, Image, Link, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { buttonStyle, font, monospacedDigit, padding, tint } from '@expo/ui/swift-ui/modifiers';
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
  return {
    banner: (
      <VStack modifiers={[padding({ all: 16 })]}>
        <HStack>
          <Image systemName="toilet.fill" color={green} size={16} />
          <Text modifiers={[font({ size: 15, weight: 'semibold' })]}>{props.title}</Text>
          <Spacer />
          <Text modifiers={[font({ size: 13 })]}>{props.at}</Text>
        </HStack>
        <HStack>
          <Text timerInterval={range} countsDown modifiers={[font({ size: 40, weight: 'bold', design: 'rounded' }), monospacedDigit()]} />
          <Spacer />
        </HStack>
        <ProgressView timerInterval={range} countsDown={false} modifiers={[tint(green)]} />
        <HStack>
          <Link label="Wee" destination={to('wee')} modifiers={[buttonStyle('borderedProminent'), tint(green), font({ size: 15, weight: 'semibold' })]} />
          <Link label="Poo" destination={to('poo')} modifiers={[buttonStyle('bordered'), tint(green), font({ size: 15, weight: 'semibold' })]} />
          <Link label="Nothing" destination={to('nothing')} modifiers={[buttonStyle('bordered'), tint(green), font({ size: 15, weight: 'semibold' })]} />
          <Link label="Accident" destination={to('accident')} modifiers={[buttonStyle('bordered'), tint(green), font({ size: 15, weight: 'semibold' })]} />
        </HStack>
      </VStack>
    ),
    compactLeading: <Image systemName="toilet.fill" color={green} size={14} />,
    compactTrailing: <Text timerInterval={range} countsDown modifiers={[font({ size: 14, weight: 'semibold' }), monospacedDigit()]} />,
    minimal: <Image systemName="toilet.fill" color={green} size={14} />,
    expandedLeading: (
      <VStack modifiers={[padding({ all: 8 })]}>
        <Image systemName="toilet.fill" color={green} size={22} />
      </VStack>
    ),
    expandedTrailing: (
      <VStack modifiers={[padding({ all: 8 })]}>
        <Text timerInterval={range} countsDown modifiers={[font({ size: 24, weight: 'bold', design: 'rounded' }), monospacedDigit()]} />
      </VStack>
    ),
    expandedBottom: (
      <VStack modifiers={[padding({ all: 8 })]}>
        <Text modifiers={[font({ size: 14, weight: 'semibold' })]}>{`${props.title} ${props.at}`}</Text>
        <ProgressView timerInterval={range} countsDown={false} modifiers={[tint(green)]} />
      </VStack>
    ),
  };
};

export default createLiveActivity('PottyTimer', PottyTimer);
