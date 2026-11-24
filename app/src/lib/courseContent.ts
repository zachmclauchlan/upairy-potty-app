// The Potty Up course: what parents read and do each day, for each method.
// Built from the UpAiry Potty Playbook (coach-playbook/*.md). Each method has:
//   prep   - lessons for the days before Day 1 (a countdown to the start date)
//   stages - the course itself. Days move on by the calendar; at the end of a stage the app looks at the
//            logs and suggests moving on, one more day, or going back. The parent always decides.
import type { RuleKey, Step } from './content';

export interface Lesson {
  t: string;          // title, e.g. "Nappies off"
  why: string;        // 2-minute read: what today is about and why
  todo: string[];     // today's checklist
  say: string[];      // words to use, word for word
  normal: string;     // what's normal today
}
export interface Stage extends Step { lessons: Lesson[] }
export interface Course { prep: Lesson[]; stages: Stage[] }

/* ---------- shared lessons ---------- */
const KIT: Lesson = {
  t: 'Get your kit ready',
  why: "Having everything within reach means you can stay calm and keep your eyes on your child, instead of hunting for clean pants mid-accident. Training pants that feel wet (but hold a small accident) help children notice what's happening.",
  todo: ['Training pants: about 10 or more pairs, so you are not washing every few hours', 'A potty in the room you spend most time in, plus a step stool and seat insert for the big toilet', 'Drinks they love, and high-fibre snacks (fruit with skin, kiwifruit, wholegrain)', 'Small rewards: stickers, a song, a high-five', 'Cleaning kit: old towels, spray, a wet bag or basket for wet clothes'],
  say: ['"Soon you get to wear big-kid pants. Do you want trucks or unicorns?"'],
  normal: "Some children are excited, some couldn't care less. Both are fine.",
};
const LESS_REMINDING: Lesson = {
  t: 'Less reminding',
  why: "The goal now is for your child to notice the feeling and go on their own. Constant reminders keep you in charge of their bladder. Step back a little at a time and let them own it.",
  todo: ['Turn the timer off for the morning', 'Only remind before leaving the house, before naps and before bed', 'Praise telling you first, every time', 'Let them pull pants up and down, flush and wash hands themselves'],
  say: ['"Your body tells you when it\'s time. Listen for it."', '"You did that all by yourself. You must be proud!"'],
  normal: 'An accident when busy playing or tired is normal for weeks yet. It is not going backwards.',
};
const WOBBLES: Lesson = {
  t: 'Wobbles are normal',
  why: "Almost every child has a wobble: a busy day, a new place, a cold, a new sibling. A few accidents after weeks of success doesn't undo anything. Go back to more reminders for a few days and it usually settles in days to a couple of weeks.",
  todo: ['If accidents creep up, bring back reminders for a few days', 'Check poos are soft and regular (hard poos cause wee accidents too)', 'Keep reactions boring: change, move on', 'Ask Lara if it lasts more than a couple of weeks'],
  say: ['"Oops, wee goes in the potty. Let\'s get dry pants."'],
  normal: 'Most children are mostly dry within a few weeks, and the odd accident for months afterwards is normal.',
};
const OUTINGS: Lesson = {
  t: 'Outings',
  why: 'New places make children forget, and unfamiliar toilets can be scary. A quick try before you go, and finding the toilet as soon as you arrive, prevents most outing accidents.',
  todo: ['A wee before every outing: "Potty first, then shoes"', 'Find the toilet as soon as you arrive somewhere', 'Pack a travel potty, a full change of clothes and a wet bag', 'Offer more often in new places than at home'],
  say: ['"We\'re going to the park. Potty first, then shoes."', 'For loud auto-flush toilets: put a sticky note over the sensor. "Let\'s give the robot toilet its sticker so it stays asleep."'],
  normal: 'An accident on the first few outings is common. It is not a reason to go back to nappies.',
};
const DAYCARE: Lesson = {
  t: 'Daycare and other carers',
  why: 'Children often do well at home and have accidents at daycare for a few weeks: it is busy, exciting and the toilets are different. Getting everyone to use the same words and timing helps most.',
  todo: ['Tell daycare your words for wee and poo, and how often to offer', 'Ask staff to tell, not ask: "Time to try before outside play"', 'Pack 3 to 4 full changes and a wet bag', 'Send them the update from Settings → Share an update'],
  say: ['To staff: "Please offer every 1.5 to 2 hours and before snack and outside play. For accidents, a calm \'wees go in the potty\' is perfect."'],
  normal: 'Accidents at daycare for weeks after home is going well are completely normal.',
};
const POO: Lesson = {
  t: 'Poo on the potty',
  why: 'Poos usually click weeks after wees. Many children hold poo because one hard poo hurt, or because the potty feels strange. Soft poos and no pressure are what fix it.',
  todo: ['Sit 15 to 30 minutes after breakfast and dinner, for 3 to 5 minutes', 'Feet on a step, knees above hips, lean forward', 'Plenty of water, fruit and fibre', 'If they ask for a nappy to poo, say yes, in the bathroom'],
  say: ['"Feet on your step, elbows on knees. Let\'s be a cow: mooooo."', '"You can have your nappy for your poo. Let\'s put it on in the bathroom."'],
  normal: 'Hiding to poo or asking for a nappy is very common. If poos are hard, painful, or 3 or more days apart, see your doctor.',
};

/* ---------- 3-day intensive ---------- */
const threeday: Course = {
  prep: [
    { t: 'How the 3-day method works',
      why: "For three days you stay home with your child bare-bottomed, offer the potty often, and catch accidents as they happen. Seeing and feeling the wee is how they learn. Three days is the start, not the finish: most children are mostly dry in 1 to 4 weeks.",
      todo: ['Pick 3 days at home with no plans (a long weekend works well)', 'Arrange help with other children if you can', 'Read the next two lessons before Day 1'],
      say: ['"Soon you\'re going to learn to do wees and poos in the potty, like a big kid."'],
      normal: "Feeling nervous is normal. You don't need to get it perfect." },
    KIT,
    { t: 'The night before',
      why: 'A calm, confident start helps your child feel safe. Talk about it in a positive way, and make tomorrow feel like a fun milestone, not a test.',
      todo: ['Cook ahead so you are free tomorrow', 'Put the potty where your child plays', 'Choose your words for wee and poo, and stick to them', 'Nappy on tonight as usual'],
      say: ['"Tomorrow the nappies are going bye-bye. You get to wear big-kid pants!"'],
      normal: 'Your child might not really understand yet. That is fine: tomorrow shows them.' },
  ],
  stages: [
    { t: 'Bare bottom at home', d: 'Days 1 to 2', len: 2, iv: 15, rule: 'catch3', expect: '5 to 10 accidents a day is normal at first. Each one teaches them the feeling.',
      steps: ['Nothing on the bottom half', 'Offer when the timer runs out', 'Catch accidents mid-wee and finish on the potty'],
      lessons: [
        { t: 'Nappies off',
          why: "Today your child learns what the wee feeling is. With nothing on the bottom half, they see and feel it straight away, and you can catch it. Your job is to stay close, watch, and stay calm. Phone away if you can.",
          todo: ['Say bye-bye to the nappies together', 'Bare bottom, T-shirt on top', 'Give lots of drinks so there are plenty of chances to practise', 'Offer the potty when the timer runs out', 'If a wee starts, calmly scoop them to the potty to finish'],
          say: ['"Potty time!" (tell, don\'t ask)', 'Mid-accident: "Wee goes in the potty!" and carry them over calmly', 'On success: "You did a wee in the potty! How does that feel?"'],
          normal: "Lots of accidents, and maybe only one or two in the potty. That's a good Day 1." },
        { t: "Watch, don't ask",
          why: "Today you start handing over. Asking \"Do you need a wee?\" usually gets a \"no\". Watch for the signs instead (going quiet, wiggling, stopping play) and get them to the potty. Make a big deal of any time they tell you or head there themselves.",
          todo: ['Still bare bottom at home', 'Watch for signs: going still, wiggling, holding, hiding', 'Offer after drinks and when the timer runs out', 'Praise telling you, even if they tell you after'],
          say: ['"You\'re wiggling. That means a wee is coming. Let\'s go!"', '"Thanks for telling me!"'],
          normal: 'Accidents usually drop today. Many children tell you once or twice.' },
      ] },
    { t: 'First outing', d: 'Day 3', len: 1, iv: 30, rule: 'rate60', expect: 'A dry walk is a big win. A few accidents at home is fine.',
      steps: ['Wee before a short walk', 'Pants or loose trousers on', 'Offer as soon as you are home'],
      lessons: [
        { t: 'Your first outing',
          why: "Today you try a short outing, so your child learns that potty skills come with them. Keep it short and local, and set them up to succeed with a wee right before you leave.",
          todo: ['Loose trousers (with or without training pants) for the outing', 'A wee right before a 20-minute walk', 'Bring a travel potty, spare clothes and a wet bag', 'Offer as soon as you get home'],
          say: ['"Potty first, then shoes."', '"You stayed dry the whole walk!"'],
          normal: 'A dry walk is a big win. An accident is fine too: change them and carry on.' },
      ] },
    { t: 'Pants on', d: 'Days 4 to 7', len: 4, iv: 45, rule: 'rate75', expect: 'Accidents tend to happen when tired, busy playing, or out.',
      steps: ['Training pants on at home', 'Offer before leaving the house and after naps', 'Prompt less, praise telling you'],
      lessons: [
        { t: 'Pants on',
          why: 'Pants go back on, and some children have a few more accidents because pants feel a bit like a nappy. Training pants that feel wet help them notice. Keep the routine the same.',
          todo: ['Training pants on at home', 'Offer after waking, meals, drinks and before going out', 'Let the timer stretch out', 'Keep accidents boring'],
          say: ['"Let\'s keep the trucks dry!"'],
          normal: 'A small rise in accidents after pants go on is normal. If it is a big rise, a day or two more bare bottom helps.' },
        { t: 'Telling you first',
          why: 'The best sign training is clicking is your child telling you before they go. Celebrate it more than anything else today.',
          todo: ['Prompt a little less than yesterday', 'Make a big deal of every time they tell you first', 'Log who started each wee: they told you, or you offered'],
          say: ['"You told me! That\'s exactly right."'],
          normal: 'Telling you after the wee is part of learning. It comes before telling you first.' },
        POO,
        { t: 'Naps and quiet times',
          why: "Naps are usually dry before nights. A wee before and straight after sleep builds the habit. Keep a nappy or pull-up for sleep for now: night dryness comes later and on its own timetable.",
          todo: ['Potty sit right before the nap and straight after waking', 'Nappy or pull-up for sleep is fine', 'If naps are often dry, try the nap without one'],
          say: ['"Wee before sleep, then cuddles."'],
          normal: "Wet nights for months (even years) after days are dry is completely normal." },
      ] },
    { t: 'Out and about', d: 'Week 2', len: 7, iv: 60, rule: 'rate80', expect: 'New places make children forget. Offer more often than at home.',
      steps: ['Wee before every outing', 'Find the toilet when you arrive', 'Travel potty in the car'],
      lessons: [OUTINGS, DAYCARE, { ...WOBBLES, t: 'Busy days' }] },
    { t: 'Independence', d: 'Weeks 3 to 4', len: 14, iv: 90, rule: 'done', expect: 'Daytime is done when they tell you most of the time and accidents are rare.',
      steps: ['Timer off for the morning', 'Remind only before leaving and at bedtime', 'Let them do it themselves'],
      lessons: [LESS_REMINDING, WOBBLES] },
  ],
};

/* ---------- bare bottom at home ---------- */
const barebottom: Course = {
  prep: [
    { t: 'How bare-bottom training works',
      why: "Over about 4 weeks you build up: bare-bottom mornings first, then all day at home, then training pants, then outings. It's gentler than 3 days at home, and still quick.",
      todo: ['Pick a start date with a few quiet mornings at home', 'Read a potty book together and let them see you use the toilet', 'Put the potty where they play'],
      say: ['"Soon you get to be bare bottom and do wees in the potty."'],
      normal: "Your child doesn't need to be excited. Calm and matter-of-fact works best." },
    KIT,
  ],
  stages: [
    { t: 'Bare-bottom mornings', d: 'Week 1', len: 7, iv: 30, rule: 'rate60', expect: 'Lots of accidents on the first two mornings, then fewer.',
      steps: ['Bare bottom from breakfast to lunch', 'Offer when the timer runs out', 'Nappy for nap and afternoon'],
      lessons: [
        { t: 'Your first bare morning',
          why: 'Bare bottom from breakfast to lunch lets your child see and feel the wee. Stay close and calm, and catch it when you can.',
          todo: ['Bare bottom from breakfast to lunch', 'Lots of drinks in the morning', 'Offer when the timer runs out', 'Nappy or pull-up for the nap and afternoon'],
          say: ['"Potty time!"', 'Mid-accident: "Wee goes in the potty!"'],
          normal: 'Mostly accidents on the first morning. That is how they learn the feeling.' },
        { t: 'Reading their signs',
          why: 'Every child has tells before a wee: going quiet, wiggling, stopping play, holding themselves. Spotting them lets you get there in time, and soon they will notice them too.',
          todo: ['Watch for their signs', 'Name it out loud when you see it', 'Offer after drinks'],
          say: ['"You\'re dancing. That means a wee is coming. Let\'s go!"'],
          normal: 'Some children show clear signs, some barely any. The timer covers the gaps.' },
        { ...POO, t: 'Poo timing' },
        { t: 'Mid-week wobble',
          why: 'Around day 4 or 5 the novelty can wear off and accidents creep up. Keep it light and consistent. It usually passes in a day or two.',
          todo: ['Same routine as before', 'Fewer questions, more "potty time" statements', 'A small reward just for sitting can help'],
          say: ['"Oops, you\'re still learning. Wee goes in the potty."'],
          normal: 'A wobble mid-week is very common. It is not a sign to stop.' },
      ] },
    { t: 'Bare bottom all day at home', d: 'Week 2', len: 7, iv: 40, rule: 'rate70x', expect: 'Outings may still be wet. That is normal this week.',
      steps: ['Bare bottom whenever you are home', 'Offer after drinks and meals', 'Training pants when you go out'],
      lessons: [
        { t: 'All day at home',
          why: 'Now bare bottom whenever you are home, so they get more practice. Training pants go on for outings.',
          todo: ['Bare bottom all day at home', 'Offer after drinks, meals and waking', 'Training pants for outings, with a wee before you leave'],
          say: ['"Potty first, then we go."'],
          normal: 'Home goes better than outings this week. That is expected.' },
        POO,
        OUTINGS,
      ] },
    { t: 'Pants on at home', d: 'Week 3', len: 7, iv: 50, rule: 'rate80', expect: 'Some children have more accidents in pants at first. It settles.',
      steps: ['Training pants on at home', 'Let the timer stretch', 'Offer before leaving the house'],
      lessons: [
        { t: 'Pants on',
          why: 'Training pants go on at home. They feel wet, so your child still notices, but hold small accidents. Keep the routine and prompt a little less.',
          todo: ['Training pants on at home', 'Let the timer stretch out', 'Praise telling you first'],
          say: ['"Let\'s keep the unicorns dry!"'],
          normal: 'A few more accidents for a day or two after pants go on is normal.' },
        { t: 'Prompt less',
          why: 'Now your child takes over. Swap questions for fewer, well-timed reminders, and let them notice the feeling.',
          todo: ['Only remind at transitions: waking, meals, going out, bed', 'Celebrate telling you first'],
          say: ['"You told me! That\'s exactly right."'],
          normal: "Telling you after the wee comes before telling you first. It's progress." },
      ] },
    { t: 'Out and about', d: 'Week 4', len: 7, iv: 60, rule: 'rate80', expect: 'Offer more often in new places.',
      steps: ['Wee before every outing', 'Find the toilet when you arrive', 'Travel potty in the car'],
      lessons: [OUTINGS, DAYCARE] },
    { t: 'Independence', d: 'Weeks 5 to 6', len: 14, iv: 90, rule: 'done', expect: 'Daytime is done when they tell you most of the time.',
      steps: ['Timer off for the morning', 'Remind only before leaving and at bedtime'],
      lessons: [LESS_REMINDING, WOBBLES] },
  ],
};

/* ---------- gentle, child-led ---------- */
const gentle: Course = {
  prep: [
    { t: 'How the gentle approach works',
      why: "You make the potty a normal part of the day first, with nappies still on. Then pants in the mornings, then all day. It's slower, low pressure, and works well for children who aren't keen yet.",
      todo: ['Put the potty where they can see it', 'Read a potty book together', 'Let them watch you use the toilet', 'Get some training pants ready for later'],
      say: ['"This is your potty. One day you\'ll do wees in it, just like me."'],
      normal: 'Nothing has to happen yet. This is about making the potty familiar.' },
  ],
  stages: [
    { t: 'Potty in the routine', d: '1 to 3 weeks', len: 14, iv: null, rule: 'catch2', expect: 'Nothing has to happen yet. Each log teaches the app their rhythm.',
      steps: ['Sit after waking, after meals and before bath', 'Read a book while they sit', 'Log every sit'],
      lessons: [
        { t: 'Make the potty normal',
          why: 'Short, relaxed sits at the same times each day make the potty part of life. No pressure for anything to happen.',
          todo: ['Sit on the potty after waking up', 'Sit after meals and before bath', 'A book or song while they sit, 2 to 3 minutes', 'Log every sit, even if nothing comes'],
          say: ['"Potty time, then breakfast."', 'Nothing came: "Good sitting! We\'ll try again later."'],
          normal: 'Most sits produce nothing at first. Sitting is the skill this week.' },
        { t: 'Routine sits',
          why: 'Consistency matters more than length. The same times every day help their body learn the routine.',
          todo: ['Keep the same sit times', 'Change nappies in the bathroom', 'Tip any poo from the nappy into the toilet together'],
          say: ['"Poo goes in the toilet. Wave bye-bye!"'],
          normal: 'A first wee in the potty might take a week or more. That is fine.' },
        { t: 'Celebrate the first wees',
          why: 'When a wee lands in the potty, celebrate warmly but without fuss. Praise the sitting too, so it never feels like failure when nothing comes.',
          todo: ['Praise sitting and any wee in the potty', 'Notice their signs before a wee', 'Keep sits short and pleasant'],
          say: ['"You did a wee in the potty! How does that feel?"'],
          normal: 'Two or more potty wees a day means they are ready for pants in the mornings.' },
      ] },
    { t: 'Pants in the mornings', d: '1 to 2 weeks', len: 7, iv: 60, rule: 'rate60', expect: 'Expect a few wet pants. Keep it light.',
      steps: ['Training pants on until lunch', 'Offer when the timer runs out', 'Nappy for nap and afternoon'],
      lessons: [
        { t: 'First pants mornings',
          why: 'Training pants until lunch. They will feel wet, which helps them notice, while holding small accidents.',
          todo: ['Training pants from breakfast to lunch', 'Offer when the timer runs out', 'Nappy for the nap and afternoon'],
          say: ['"Let\'s keep the puppies dry!"'],
          normal: 'Some wet pants each morning are expected at first.' },
        { t: 'Accidents, calmly',
          why: 'How you react to accidents matters more than the accident. Calm and boring helps them learn; fuss or frustration makes them anxious.',
          todo: ['Same calm words every time', 'Let them help put wet clothes in the basket', 'Move on quickly'],
          say: ['"Oops, wee goes in the potty. Let\'s get dry pants."'],
          normal: 'Accidents are how they learn the feeling. They are not failures.' },
      ] },
    { t: 'Pants all day', d: '1 to 2 weeks', len: 7, iv: 60, rule: 'rate75', expect: 'Accidents tend to come when tired or busy.',
      steps: ['Training pants all day', 'Offer after drinks, meals and waking', 'Nappy only for sleep'],
      lessons: [
        { t: 'All day in pants',
          why: 'Pants all day now, with a nappy only for sleep. Keep offering at the usual times.',
          todo: ['Training pants all day', 'Offer after drinks, meals and waking', 'Nappy or pull-up only for sleep'],
          say: ['"Potty first, then play."'],
          normal: 'Afternoon accidents are common when they are tired.' },
        POO,
      ] },
    { t: 'Out and about', d: '1 to 2 weeks', len: 7, iv: 75, rule: 'rate80', expect: 'Offer more often in new places.',
      steps: ['Wee before every outing', 'Find the toilet when you arrive'],
      lessons: [OUTINGS, DAYCARE] },
    { t: 'Independence', d: 'Ongoing', len: 14, iv: 90, rule: 'done', expect: 'Daytime is done when they tell you most of the time.',
      steps: ['Wait for them to tell you', 'Remind only before leaving and at bedtime'],
      lessons: [LESS_REMINDING, WOBBLES] },
  ],
};

/* ---------- nights ---------- */
const night: Course = {
  prep: [
    { t: 'How night dryness works',
      why: "Staying dry at night depends on a hormone that cuts night-time wee, and on the brain learning to wake for a full bladder. Both mature on their own timetable, usually between 3 and 5. You can't train it faster, but you can make it easy when they're ready.",
      todo: ['Keep night nappies on for now', 'Get a waterproof bed mat ready', 'Keep drinks up during the day'],
      say: ['"Your body is still learning to stay dry at night. That\'s okay."'],
      normal: 'About 1 in 7 five-year-olds still wet the bed sometimes.' },
  ],
  stages: [
    { t: 'Watch dry mornings', d: '1 to 2 weeks', len: 14, iv: null, rule: 'night4', expect: '4 or more dry mornings a week means they are likely ready.',
      steps: ['Check the nappy every morning', 'Log dry or wet', 'Log the last drink of the day'],
      lessons: [
        { t: 'Check the mornings',
          why: 'Dry or nearly dry nappies in the morning are the best sign their body is ready. Log every morning for a week or two.',
          todo: ['Check the nappy first thing and log dry or wet', 'Wee straight after waking', 'Log the last drink of the day'],
          say: ['Dry: "Your nappy is dry! Your body is learning."'],
          normal: 'Mixed weeks are normal. Look for a pattern, not single nights.' },
        { t: 'Drinks and the bedtime wee',
          why: "Don't cut drinks across the day: that backfires. Spread drinks through the day and stop about an hour before bed.",
          todo: ['Drinks at every meal and snack, mostly water', 'Last drink about an hour before bed', 'A relaxed wee as part of getting ready for bed', 'No fizzy or caffeine drinks after lunch'],
          say: ['"Last drink now, then bath and teeth."'],
          normal: 'Constipation makes night wetting worse, so check poos are soft too.' },
      ] },
    { t: 'Bedtime routine', d: '1 week', len: 7, iv: null, rule: 'always', expect: 'Building habits before the nappy comes off.',
      steps: ['Last drink an hour before bed', 'Wee before bath and right before sleep', 'Night light to the potty'],
      lessons: [
        { t: 'Build the routine',
          why: 'A steady bedtime routine sets them up for nappy-free nights: last drink, bath, a wee, stories, a last wee, sleep.',
          todo: ['Last drink about an hour before bed', 'Wee before bath and again right before lights out', 'Night light and a potty near the bed', 'Practise getting pyjamas down quickly'],
          say: ['"If you feel a wee in the night, the potty is right there, and you can call me."'],
          normal: "It's a habit week. Nothing needs to change at night yet." },
      ] },
    { t: 'Nappy-free nights', d: '2+ weeks', len: 14, iv: null, rule: 'night5', expect: 'Wet nights are common for weeks. Stay calm and keep logging.',
      steps: ['Bed mat and spare sheets ready', 'Training pants at night', 'Log every morning'],
      lessons: [
        { t: 'First nappy-free night',
          why: 'Protect the bed, not the child, so they can feel wet. "Double-make" the bed so a 2 am change takes two minutes.',
          todo: ['Mattress protector, mat, sheet, then a second mat and sheet on top', 'Training pants or pyjamas only', 'Same bedtime routine', 'Log the morning: dry or wet'],
          say: ['"Tonight you\'re sleeping in big-kid pants. The special mat keeps your bed cosy if a wee comes out."'],
          normal: 'Judge after 1 to 2 weeks, not one night.' },
        { t: 'Handling wet nights',
          why: 'Low light, quiet voice, quick change, back to bed. Never blame or shame: it is not something they can control yet.',
          todo: ['Strip the top layer only', 'Wee in the toilet, dry pyjamas, back to sleep', 'Reward the routine (bedtime wee, getting up), not dry nights'],
          say: ['"Uh-oh, a wee came out. Let\'s get you dry and cosy."'],
          normal: 'If nearly every night is soaked after two weeks, go back to night pants without fuss and try again in 1 to 3 months.' },
      ] },
    { t: '7 dry nights', d: 'Finish line', len: 7, iv: null, rule: 'done', expect: 'If most nights are still wet after a month, it is fine to pause and try again later.',
      steps: ['Keep the bedtime routine going'],
      lessons: [
        { t: 'Nearly there',
          why: 'Keep the routine going. The odd wet night (illness, a big day, a late drink) is normal even once they are dry.',
          todo: ['Keep the routine', 'Keep the bed mat on for a while', 'Celebrate a dry week together'],
          say: ['"A whole week of dry nights! Your body learned that."'],
          normal: 'From 5, help is available if wetting still bothers your child. Talk to your GP.' },
      ] },
  ],
};

export const COURSES = { threeday, barebottom, gentle, night };
export type { RuleKey };
