// Lara: the Potty Up AI coach's name and the conversation starters shown when a chat begins.
import { S } from './store';
import { item, M } from './logic';

export const COACH_NAME = 'Lara';
export const COACH_TAG = 'Potty coach';

/** Lara's opening message, personalised to the child's program. Shown when the chat is empty. */
export function greeting() {
  const nm = S.child.name || 'your little one';
  const it = item();
  return `Hi, I'm ${COACH_NAME}! I'm here to help with ${nm}'s potty training, any time, day or night.\n\nI can see ${nm} is on "${it.t}" (${M().name}), and I'll use your logs to tailor my answers.\n\nWhat's on your mind? Pick one below, or type your own question.`;
}

/** Tap-to-ask starters: [chip label, the question sent]. */
export const STARTERS: [string, string][] = [
  ['Lots of accidents', 'We are having lots of accidents. Is that normal, and what should I change?'],
  ["Won't poo on the potty", "They wee on the potty but won't poo on it. What do I do?"],
  ['Refuses to sit', 'They refuse to sit on the potty. How do I handle it?'],
  ['Doesn\'t tell me', 'How do I get them to tell me before they need to go?'],
  ['Should we move on?', 'Are we ready to move to the next step?'],
  ['Regression', 'They were doing well and now keep having accidents again. Why, and what helps?'],
  ['Daycare', 'How do I handle potty training with daycare?'],
  ['Nights', 'When and how should we start night training?'],
  ['Outings and travel', 'How do I handle outings and car trips while training?'],
  ['What to buy', 'What do I need for potty training, and how many training pants?'],
];
