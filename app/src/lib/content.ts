// Content carried over word for word from the prototype (index.html).
import type { IconName } from '@/components/Icon';
import type { Tone } from './theme';
import { COURSES } from './courseContent';

export type MethodKey = 'threeday' | 'barebottom' | 'gentle' | 'night';
export type RuleKey = 'always' | 'catch3' | 'catch2' | 'rate50' | 'rate60' | 'rate70x' | 'rate75' | 'rate80' | 'night4' | 'night5' | 'done';
export type Where = 'none' | 'sits' | 'some' | 'day';
export type Mood = 'great' | 'mixed' | 'tough';
export interface Step { t: string; d: string; len: number; iv: number | null; rule: RuleKey; steps: string[]; expect: string }
export interface Method { name: string; ic: IconName; tone: string; blurb: string; need: string; pace: string; items: Step[] }
export interface Article { t: string; m: number; ic: IconName; tone: string; body: string }
export interface Situation { k: string; t: string; ic: IconName; tone: string; kw: string[]; steps: string[]; say: string[] }
export interface Song { t: string; tag: string; l: string[] }
export interface Product { t: string; p: string; img: string; h: string; why: string }
export const SHOP = 'https://upairy.com/products/';
export const CDN = 'https://cdn.shopify.com/s/files/1/0684/6149/4493/files/';
export const toneOf = (t: string) => t.replace('t-', '') as Tone;

export const METHODS: Record<MethodKey, Method> = {
 threeday:{name:'3-day intensive',ic:'bolt',tone:'t-sun',blurb:'Three full days at home with nothing on the bottom half. Fastest, but needs your full attention.',need:'3 days at home',pace:'About 1 week',items:COURSES.threeday.stages},
 barebottom:{name:'Bare bottom at home',ic:'home',tone:'t-ok',blurb:'Bare bottom at home in the mornings, then all day. More relaxed, and works around daycare.',need:'Mornings at home',pace:'About 3–4 weeks',items:COURSES.barebottom.stages},
 gentle:{name:'Gentle, child-led',ic:'leaf',tone:'t-water',blurb:'Nappies stay on to begin with. The potty becomes part of the daily routine until they start using it.',need:'No time off needed',pace:'1–3 months',items:COURSES.gentle.stages},
 night:{name:'Nights',ic:'moon',tone:'t-water',blurb:'For children dry in the day. Night dryness depends on a hormone that develops on its own schedule.',need:'Day dry first',pace:'Varies',items:COURSES.night.stages},
};

export const ARTICLES: Article[] = [
 {t:'Holding in poo',m:4,ic:'poo',tone:'t-poo',body:'Holding in poo is the most common snag in potty training. It hurts a bit, so they hold it, so it hurts more.\n\nWhat helps: plenty of water, fruit and fibre. Let them poo in a nappy if they ask, sitting in the bathroom, then work toward the potty. A footstool so knees are above hips. Never force them to sit.\n\nSee a doctor if they have not pooed for 4 days, or if it hurts every time.'},
 {t:'When it goes backwards',m:3,ic:'heart',tone:'t-acc',body:'Regression is normal after a new sibling, a move, starting daycare, or illness.\n\nGo back one step in the program, bring back a shorter timer, and keep reactions boring. Most regressions pass in 1 to 2 weeks.'},
 {t:'Daycare and grandparents',m:3,ic:'users',tone:'t-water',body:'Consistency matters more than method. Share the words your child uses, how often to offer the potty, and what you do after accidents.\n\nUse the share button on the Today screen to send a quick update before drop-off.'},
 {t:'Out and about',m:2,ic:'car',tone:'t-sun',body:'Always offer a wee before leaving. Keep a spare set of clothes and a travel potty in the car. Find the toilet when you arrive, before they need it.'},
];

export const SITUATIONS: Situation[] = [
 {k:'refuse',t:'Refusing to sit',ic:'x',tone:'t-acc',kw:['refus','won\'t sit','wont sit','says no','no potty','tantrum','fight'],
  steps:['Stay calm and keep your voice light. No pleading.','Offer a choice, not a question: "Potty now, or after this song?"','Drop it if they still say no. Try again in 15–20 minutes.','Make sitting fun: a book, a song, or the sit timer.','Never hold them on the potty. It turns it into a power struggle.'],
  say:['"Do you want to walk or hop to the potty?"','"Your body will tell you. We\'ll try again soon."']},
 {k:'accident',t:'Just had an accident',ic:'drop',tone:'t-acc',kw:['accident','wet','peed on','pooed in','floor','pants wet'],
  steps:['Keep your face and voice neutral. No sighs, no "oh no".','Take them to the potty to finish, even if nothing comes.','Let them help clean up, as a job, not a punishment.','Change into fresh pants and move on.','Log it. Patterns in accidents tell you when to offer the potty.'],
  say:['"Wee goes in the potty. Let\'s sit and see if there\'s any more."','"That\'s okay. You\'re learning."']},
 {k:'poo',t:'Holding in poo',ic:'poo',tone:'t-poo',kw:['poo','poop','constipat','hold','withhold','hiding to poo','hides'],
  steps:['Lots of water, fruit and fibre today.','A sit 15–20 minutes after meals, with feet on a stool.','If they ask for a nappy to poo, say yes, in the bathroom. Then work toward the potty.','Blow bubbles or a balloon while sitting to relax the tummy.','See a doctor if it\'s been 4+ days, if it hurts every time, or there\'s blood.'],
  say:['"Your poo wants to go in the potty. Let\'s give it a cosy place."','"You can do it when you\'re ready."']},
 {k:'public',t:'Out in public',ic:'car',tone:'t-sun',kw:['public','shop','outside','car','park','restaurant','travel','loud flush','out and about'],
  steps:['Wee before you leave, every time.','Find the toilet as soon as you arrive.','Bring a travel potty and a full change of clothes.','Cover the auto-flush sensor with a sticky note if they\'re scared of it.','Offer more often than at home. New places make them forget.'],
  say:['"Let\'s find the potty first, then we can explore."']},
 {k:'night',t:'Wet nights',ic:'moon',tone:'t-water',kw:['night','bed','wet the bed','sleep','nappy at night','overnight'],
  steps:['Night dryness depends on a hormone, not effort. Don\'t push it.','Last drink an hour before bed, and a wee right before sleep.','Bed mat and spare sheets ready to make changes fast.','Log mornings. 4+ dry a week means they\'re likely ready.','Most children are dry at night months after the day.'],
  say:['"Your body is still learning at night. That\'s okay."']},
 {k:'regress',t:'Going backwards',ic:'heart',tone:'t-acc',kw:['regress','backward','was doing well','new baby','sibling','daycare','started again','moving house'],
  steps:['Look for a trigger: new sibling, daycare, illness, a move.','Go back one step in the program for a few days.','Bring the timer back to a shorter gap.','Keep reactions boring and praise effort.','Most regressions pass in 1–2 weeks. Check for pain or a UTI if it\'s sudden.'],
  say:['"Let\'s practise together again. You\'re doing great."']},
 {k:'scared',t:'Scared of the toilet',ic:'smile',tone:'t-water',kw:['scared','afraid','fear','flush','falling in','big toilet'],
  steps:['Use a potty or a seat insert so they feel secure.','Let them flush after they\'ve left the room at first.','Let a toy "go" first.','Never force them onto the big toilet.'],
  say:['"You\'re safe. I\'m right here."','"Teddy wants to try first. Can you help him?"']},
 {k:'busy',t:'Too busy playing',ic:'bolt',tone:'t-sun',kw:['playing','too busy','won\'t stop','ignores','distracted','tv','screen'],
  steps:['Use transitions: "When the timer beeps, potty, then back to play."','Pause the toy or show, so it\'s waiting for them.','Bring the toy to the bathroom.','Let them press start on the sit timer themselves.'],
  say:['"Potty first, then the blocks are waiting for you."']},
];

export const SONGS: Song[] = [
 {t:'Potty Time Hop',tag:'Sitting',l:['Hop, hop, it\'s potty time,','Sit right down, you\'re doing fine,','Listen to your tummy say,','Wee goes in the potty today!']},
 {t:'Sit and Wait',tag:'Sitting',l:['Sit and wait, sit and wait,','Count to ten, you\'re doing great,','If it\'s quick or if it\'s slow,','Your body knows when it\'s time to go.']},
 {t:'The Tinkle Train',tag:'Sitting',l:['Choo choo, here\'s the tinkle train,','Pulling in from tummy lane,','All aboard the potty seat,','Toot toot, that\'s a treat!']},
 {t:'My Big Kid Pants',tag:'Pants on',l:['I\'ve got my big kid pants on,','Dry and comfy all day long,','When I feel I need to go,','I tell my grown-up so they know!']},
 {t:'Wash Wash Hands',tag:'After',l:['Bubbles here and bubbles there,','Rub the soap in everywhere,','Rinse it off and shake, shake, shake,','Clean hands, high five, mate!']},
 {t:'Flush Goodbye',tag:'After',l:['Wave goodbye and flush it down,','Swirling, whirling round and round,','Lid goes down and off we go,','Bye bye, see you, cheerio!']},
 {t:'Tummy Talk',tag:'Learning',l:['My tummy talks, it says hello,','It tells me when I need to go,','I stop my play and run so fast,','The potty\'s here, I made it at last!']},
 {t:'Five Little Drops',tag:'Sitting',l:['Five little drops went splish and splash,','Into the potty in a flash,','Four, three, two, and one more too,','Well done {name}, that was you!']},
 {t:'Potty Superstar',tag:'Celebrate',l:['Who\'s the potty superstar?','{name} is, yes, there you are!','Sitting tall and feeling proud,','Give a cheer and say it loud!']},
 {t:'Slow and Steady',tag:'Calm',l:['Slow and steady, take your time,','Every try is just fine,','Breathe in deep and blow it out,','That\'s what potty\'s all about.']},
 {t:'Morning Wee',tag:'Routine',l:['Good morning sun, good morning me,','First thing first, a morning wee,','Out of bed and on the seat,','Then it\'s brekkie time to eat!']},
 {t:'The Poo Song',tag:'Calm',l:['Sometimes poo is slow to come,','Rub your tummy, hum hum hum,','Feet up high on the little stool,','Pushing gently, nice and cool.']},
 {t:'Before We Go',tag:'Routine',l:['Before we go out to play,','Potty first, hip hip hooray,','Shoes and hat and one more wee,','Now we\'re ready, one two three!']},
 {t:'Oops-a-Daisy',tag:'Accidents',l:['Oops-a-daisy, that\'s okay,','Accidents happen every day,','Clean it up and try again,','Next time potty, you\'ll know when.']},
 {t:'Dino Stomp',tag:'Sitting',l:['Stomp, stomp, dino feet,','Stomping to the potty seat,','Roar a big roar, then sit down,','Best little dino in the town!']},
 {t:'Sleepy Wee',tag:'Bedtime',l:['Stars are out, the moon is high,','One last wee before bye-bye,','Cosy bed and dreams so sweet,','Dry all night from head to feet.']},
 {t:'Countdown',tag:'Sitting',l:['Ten, nine, eight, sit on the seat,','Seven, six, five, wiggle your feet,','Four, three, two, nearly done,','One! Potty time is so much fun!']},
 {t:'Animal Parade',tag:'Sitting',l:['The duck says quack, the cow says moo,','The cat goes potty, so can you,','The dog says woof, the sheep says baa,','{name} goes potty, ta-da-da!']},
 {t:'Pants Down, Pants Up',tag:'Learning',l:['Pants down, sit down, nice and slow,','Wait and listen, here we go,','Wipe and flush and pants back up,','Wash your hands, and that\'s enough!']},
 {t:'I Did It!',tag:'Celebrate',l:['I did it, I did it, all by me,','I went in the potty, can\'t you see,','Clap your hands and stamp your feet,','Being a big kid is so sweet!']},
];

export const PRODUCTS: Record<string, Product> = {
 pants5:{t:'Potty Training Underwear, 5-pack',p:'$35',img:'weoiugrhwoeriu.png',h:'5-pack-potty-training-underwear',why:'Feels wet so they notice, but holds the mess.'},
 pants10:{t:'Potty Training Underwear, 10-pack',p:'$68',img:'3feba55b-3700-48f1-8f6f-5e8729de743f.png',h:'10-pack-potty-training-underwear',why:'Enough pairs for intensive days without washing every few hours.'},
 daykit:{t:'Daytime Potty Training Kit',p:'$69',img:'boybundle.png',h:'daytime-potty-training-kit',why:'Everything for the first week of daytime training.'},
 nightkit:{t:'Nighttime Potty Training Kit',p:'$59',img:'Frame_985.png',h:'nighttime-kit-v1',why:'For going nappy-free at night.'},
 bedmat:{t:'Waterproof Bed Mat + Mesh Wash Bag',p:'$43.99',img:'Frame992.png',h:'mesh-wash-bag-waterproof-bed-mat-protection-pack',why:'Makes a 2 am change take two minutes.'},
 wetbag:{t:'Waterproof Wet Bags',p:'$25',img:'3_bags.png',h:'wet-laundry-bag',why:'Wet pants go in, the nappy bag stays dry.'},
 soap:{t:'Kids Safe Flower Soap',p:'$29',img:'MainPDP.png',h:'flower-hand-soap',why:'Makes handwashing after the potty part of the fun.'},
};

export const DESIGNS: [string, string, string][] = [['Trucks','Trucks_Product_Picture_8ef10baf-1385-474b-abbb-859610063db7.png','trucks'],['Planes','Frame_10596_1_de358d8e-88c2-42c6-b36d-46f72831397d.png','planes'],['Safari','Safari_Product_Picture_41410476-3a82-4261-8caa-3d2b702876d5.png','giraffe'],['Puppies','puppies_iteration_2_1_1_f5e5acb7-274d-4fa7-abb2-86b0583025a3.png','puppies'],['Unicorn','Unicorns_Product_Picture_1_1_0652a7a9-da83-42b7-90de-fe0ed3c5d5f5.png','unicorn'],['Whale','Whale_Product_Picture_87958897-fab5-4407-98cf-ec829ffbc6da.png','whale'],['Bears','Bears_Product_Picture_1_1_be1eeff5-bae4-458d-859e-027e31027ab5.png','koala'],['Ladybug','Ladybug_Product_Picture_ed4d1f9a-00d9-4a0d-8894-05e38f97aa31.png','ladybug'],['Space','Space_Product_Picture_e7a328af-6d74-49f5-8d0a-4528845d59c9.png','aliens']];

export const PAIRS: Record<MethodKey, number> = {threeday:10,barebottom:8,gentle:6,night:4};

export const QUIZ: { g: string; q: string }[] = [
 {g:'Body',q:'Stays dry for 1–2 hours at a stretch'},
 {g:'Body',q:'Poos at fairly regular times'},
 {g:'Body',q:'Can pull pants up and down'},
 {g:'Understanding',q:'Notices or tells you when wet or dirty'},
 {g:'Understanding',q:'Follows a simple 2-step instruction'},
 {g:'Understanding',q:'Hides or goes quiet to wee or poo'},
 {g:'Interest',q:'Curious about the toilet or your bathroom trips'},
 {g:'Interest',q:'Wants to do things "by myself"'},
];

export const WHERE: { v: Where; t: string; s: string; ic: IconName }[] = [
  {v:'none',t:'Still in nappies',s:'Hasn\'t really tried the potty yet',ic:'leaf'},
  {v:'sits',t:'Sits on the potty sometimes',s:'Occasionally, mostly nothing happens',ic:'hour'},
  {v:'some',t:'Uses the potty sometimes',s:'Some wees in the potty, still in nappies',ic:'drop'},
  {v:'day',t:'Dry in the day',s:'Ready to work on nights',ic:'moon'},
];

export const SUGG: string[] = ['Is it normal to have this many accidents?','How do I get them to tell me before they go?','They refuse to sit on the potty','When should we start night training?','Should I use pull-ups at daycare?'];

export const MOODS: [Mood, string, IconName][] = [['great','Great day','smile'],['mixed','Mixed','heart'],['tough','Tough day','bolt']];

export const TAGS: string[] = ['Told me before going','Poo on the potty','Dry nap','Refused to sit','Busy day out','Unwell or tired'];

export const STKC: string[] = ['#F2B705','#E8735A','#5AA35A','#4A8BD6','#B27AD6','#F29E4C'];

