// Parent reviews shown on the "Building your plan" screen. Each is tagged so we can show the ones
// closest to a family's quiz answers (age, starting point, what makes it harder, temperament, team, method).
// Swap in matched real reviews by editing the entries below; keep the tags.
import type { MethodKey } from './content';

export interface Review { n: string; age: number; loc: string; when: string; t: string; tags: string[] }

export const REVIEWS: Review[] = [
  { n: 'Sarah', age: 34, loc: 'NZ', when: '2 weeks ago', t: 'We did the 3-day method over Labour Weekend. Day 1 was messy, day 2 clicked, and by day 3 he was taking himself. Having the lessons each morning kept me calm.', tags: ['threeday', '2½ to 3', 'some', 'easygoing'] },
  { n: 'James', age: 38, loc: 'AU', when: '1 month ago', t: "As a dad doing most of the training, I needed it laid out step by step. The timer and the daily lesson meant I wasn't guessing. Dry in 9 days.", tags: ['partner', 'threeday', '2 to 2½', 'none'] },
  { n: 'Emma', age: 31, loc: 'UK', when: '3 weeks ago', t: 'My daughter was terrified of the toilet. The plan started tiny, just sitting in clothes, and the songs did the rest. She now runs to it singing the Tinkle Train.', tags: ['fear', 'cautious', 'sensitive', 'gentle'] },
  { n: 'Aroha', age: 29, loc: 'NZ', when: '1 week ago', t: "Constipation was our whole problem. Lara explained the footstool and the poo song, and we finally stopped dreading it. No more holding on for days.", tags: ['constipation', '3+', 'some'] },
  { n: 'Megan', age: 36, loc: 'US', when: '2 months ago', t: 'He trained, then completely regressed when his baby sister arrived. The plan took us back a stage without making it feel like failing. Back on track in two weeks.', tags: ['regressed', 'change', '2½ to 3', 'barebottom'] },
  { n: 'Tom', age: 41, loc: 'UK', when: '3 weeks ago', t: 'Strong-willed doesn\'t begin to cover it. Every "do you need a wee?" was a fight. The app taught us to stop asking and just make it part of the routine. Total game changer.', tags: ['strong-willed', '3+', 'sits', 'barebottom'] },
  { n: 'Priya', age: 33, loc: 'AU', when: '1 month ago', t: 'Our son is autistic and sensory-sensitive, so the big intensive methods were never an option. The gentle course went at his pace and the visual routine really helped.', tags: ['nd', 'sensory', 'gentle', 'cautious'] },
  { n: 'Hannah', age: 27, loc: 'NZ', when: '5 days ago', t: 'Single mum, full-time work, daycare five days. I thought training was impossible for us. Bare bottom in the mornings and the daycare handout made it work.', tags: ['solo', 'daycare', 'barebottom', '2 to 2½'] },
  { n: 'Linda', age: 62, loc: 'NZ', when: '2 weeks ago', t: "I look after my grandson three days a week. The handout means I say exactly what his mum says, same words, same rewards. He's dry at Nana's now too.", tags: ['grandparents', '2½ to 3', 'some'] },
  { n: 'Chloe', age: 30, loc: 'US', when: '1 week ago', t: 'I was going to wait till she was 3 but the readiness quiz showed she had most of the signs. Started at 2 years 4 months and she was dry within two weeks.', tags: ['2 to 2½', 'none', 'easygoing', 'threeday'] },
  { n: 'Ben', age: 35, loc: 'UK', when: '1 month ago', t: 'Days were sorted but nights were a nightmare. The night course explained why it takes longer and what actually helps. Dry 6 nights out of 7 now.', tags: ['day', 'night', '3+'] },
  { n: 'Jess', age: 32, loc: 'AU', when: '3 weeks ago', t: 'Accidents everywhere for a fortnight and I nearly gave up. The evening check-in kept telling me it was normal for the stage, and it was. Then it just clicked.', tags: ['some', 'sits', 'barebottom', 'sensitive'] },
  { n: 'Olivia', age: 28, loc: 'NZ', when: '2 weeks ago', t: "Moved house in the middle of training and I was sure we'd lost it all. We paused the course for a week, picked up where we left off, and he never looked back.", tags: ['change', 'regressed', 'cautious'] },
  { n: 'Mark', age: 39, loc: 'US', when: '1 month ago', t: 'Our daughter has ADHD and sitting still was the battle. Shorter sits, a song on the timer and stickers she chose herself. Simple, but nobody had told us.', tags: ['nd', 'strong-willed', '3+', 'gentle'] },
  { n: 'Rachel', age: 35, loc: 'UK', when: '6 days ago', t: 'She was under 2 and showing interest, so we did the gentle course. No pressure, the potty just became normal. By 26 months she was out of nappies in the day.', tags: ['Under 2', 'none', 'gentle', 'easygoing'] },
  { n: 'Kate', age: 37, loc: 'AU', when: '2 weeks ago', t: 'The best bit is that it learns his timing. After a few days the reminder pops up right before he needs to go. Feels like magic.', tags: ['some', 'partner', '2½ to 3'] },
  { n: 'Sophie', age: 31, loc: 'NZ', when: '1 month ago', t: 'Asking Lara at 9pm when he refused to poo anywhere but his nappy saved my sanity. Real answers, not just "be patient". Took about 10 days to crack it.', tags: ['constipation', 'fear', 'strong-willed'] },
  { n: 'Daniel', age: 36, loc: 'NZ', when: '3 weeks ago', t: 'My partner and I were doing it completely differently. Having one plan on both our phones meant we finally stopped confusing her. Dry in under three weeks.', tags: ['partner', 'barebottom', '2 to 2½', 'varies'] },
];

/** Reviews ordered by how closely they match this family's answers (best first). */
export function reviewsFor(a: { age: string; where: string | null; harder: string[]; temper: string | null; team: string[]; method: MethodKey }) {
  const want = [a.age, a.where ?? '', ...a.harder, a.temper ?? '', ...a.team, a.method];
  const score = (r: Review) => r.tags.reduce((s, t) => s + (want.includes(t) ? (a.harder.includes(t) ? 3 : 1) : 0), 0);
  return REVIEWS.map((r, i) => ({ r, s: score(r), i })).sort((x, y) => y.s - x.s || x.i - y.i).map(x => x.r);
}
