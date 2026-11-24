# UpAiry Potty: App Map (v3)

**Rule for every screen:** it answers a question a parent has *right now*, mid-training. If it doesn't, it goes.

---

## 1. What the competitor apps do (from the screenshots)

| App | Core features | Weak spots we fix |
|---|---|---|
| **Sprout** (purple) | Predicts the next likely potty window from logs ("Otto may need to go in 14 min"). One-tap logging (success / accident / tried × pee / poop / both). A staged program (Getting ready → Days 1–3 at home → Days 4–7 → Out and about → Naps). Insights: success rate, dry streak, average gap, daily trend, time-of-day patterns, suggestions. Caregiver sharing through iCloud (owner / can edit / view only). Multiple children, guides, offline logging, Apple Watch, lock-screen Live Activity, Siri ("log a pee"). | One program for everyone. No method choice, no check-in that adapts, and nothing for the child. |
| **Sprout Timer** (orange) | Big countdown timer with pause / nap / end day. Logging: pee, poop, accident, tried. Insights: catch rate, best dry streak, "finish line" progress, catch-rate trend. History calendar with day timeline. Routines: when poo tends to happen, accident patterns by time of day, adaptive suggestions ("dry past 45 min 3×, try 50?"). | Utility only. No plan for what to do each day. |
| **Potty Whiz** | Multi-child dashboard. Activity log: sat on potty, went, accident, **drank fluid**, plus details (told you they needed to go, wiped, flushed, washed hands). Potty timer with duration dial. Progress dashboard with calendar / chart / compare. Tips. Apple Watch. No login needed. | Busy, dated UI. Data but no guidance. |
| **PottyPurr** | Readiness quiz ("Does your child stay dry 2 hours?"). A "potty path" journey (learn the basics → comfort with potty → first success → build the habit). Weekly overview chart (sat / success / accident by hour). Apple Watch + lock screen. | Generic. The path doesn't react to your data. |
| **Potty Training Time** | Child gets a sticker after each success. Reminders with interval, start and end time. Memory game while sitting on the potty. Log wee / poo / nothing / accident. iCloud sharing between parents. | Old design, little insight. |

**Where we win:** a program that is chosen for *your* child and *your* week (3-day, bare bottom, gentle, nights), an evening check-in that adapts it, timing that visibly learns, and a kid-facing sit timer and celebration. UpAiry rewards come later.

---

## 2. How the app works now

### Onboarding (about 1 minute), then a guided tour
1. Value screen
2. Child's name, age, the words they use for wee and poo
3. **Where are they now?** Still in nappies / sits sometimes / uses the potty sometimes / dry in the day (goes straight to the night program)
4. Readiness signs (4) + "Can you spend 3 days at home?"
5. **Choose a method**, with one suggested from the answers:
   - **3-day intensive** (ready + 3 days at home): Get ready → Day 1 bare bottom (every 15 min) → Day 2 (20) → Day 3 first outing (30) → Pants on days 4–7 (45) → Out and about → Independence
   - **Bare bottom at home** (works around daycare): Get ready → Bare-bottom mornings (wk 1) → Bare bottom all day (wk 2) → Pants on at home → Out and about → Independence
   - **Gentle, child-led** (not ready yet): Potty in the routine (sits after waking / meals / bath, no timer) → Pants mornings → Pants all day → Out and about → Independence
   - **Nights**: Watch dry mornings → Bedtime routine → Nappy-free nights → 7 dry nights
6. The child's program, with steps they've already passed marked as skipped
7. Start fresh, or explore with a sample week
8. **6-step spotlight tour** of the Today screen, ending with a live preview of a reminder notification. It can be replayed from Program → Settings.

### Today
- **Next potty try** countdown, with the reason shown underneath
- **Learning panel** until there's enough data: "Learning Mia's rhythm, 2 of 6 gaps"
- Log potty sheet: result, wee/poo, who started it, when
- One-tap Drink / Meal / Woke up, plus a Sit timer (a 3-minute kid screen)
- Today's counts, poo watch alert, today's plan from the program, timeline
- **Evening check-in** (highlighted after 4 pm): shows the day's numbers, and the program suggests continuing, repeating, or going back, with the reason. The parent picks. Nothing moves on its own.
- Share button: a text-ready handover for grandparents or daycare
- Reminder banner about 5 minutes before the likely window

### How the timing learns (no magic, all from the child's own logs)
| Learned value | Needs | Used for |
|---|---|---|
| Time between wees (morning and afternoon separately) | 6 gaps | The base countdown |
| Wee after a drink | 3 drinks followed by a wee | Brings the next try forward after a drink |
| Wee after waking | 3 wake-ups | The first try after waking or a nap |
| Usual poo time | 3 poos | The poo watch tip |

Until a value is learned, the timer uses the **program step's** default (e.g. every 15 min on Day 1). A learned gap is capped at 1.6× the step's interval so it can't stretch too far too early. The parent can switch to a fixed interval at any time.

### Program tab
Current step (day X of Y, offer interval, what to expect), **what moves you on**, every step with details, the ability to jump back or ahead to any step, change method (logs are kept), guides (holding in poo, regression, daycare, outings), settings, replay tour, start over.

### History
Month calendar with daily success % and dots. Each day shows its timeline, night result, and the check-in decision.

### Insights
**What we've learned about the child** (with a confidence bar per value), success rate this week, told-you-first %, accidents per day, days logged, success by day, accidents by hour with a concrete tip. Purely informational, with no buttons that move the program.

### More competitors (second batch)
| App | Key idea | What we took |
|---|---|---|
| PottyPond | Frog mascot, a "pond" that grows with wins, a crown journey. Accidents stay neutral. Fully offline, one-time purchase. | Neutral accident language. On-device data. |
| Potty Path | Pip the bear mascot. 10-question readiness quiz, child-led plan in phases, sticker board, kid mode. | 8-question readiness check with a score. Kid mode. |
| Potty Pal AI | AI coach chat that knows the child's profile and logs. Personalised 7-day plan. Reminders (every 90 min, bedtime check, after meals). | AI coach with log context. Meal and bedtime reminders. |
| Potty Time (Lalo) | Kid mode ("hand them the phone"), stars, custom rewards ("ice cream after dinner"), AI coach. | Stars, custom rewards, kid mode. |
| Potty Steady | 8 coaching situations with "what to do" and "what to say". Track public vs home, prompted vs initiated. Caregiver brief. Offline. | 8 offline situation guides with exact words to say. |

We take the ideas, not the look: no copied mascots, names, art or copy.

### Tabs (v4)
`Today` · `Program` · `Coach` · `Kid zone` · `Progress` (Insights and History)

- **Coach:** 8 "right now" guides that work offline (refusing to sit, accident, holding poo, out in public, wet nights, going backwards, scared of the toilet, too busy playing), each with steps and the exact words to say. Plus a chat with the AI coach (Claude), which sees the age range, program step and summary numbers, never the child's name. Without AI, answers come from the guides.
- **Kid zone:** a star balance (2 for a success, 1 for trying, 3 for a dry night), a 30-sticker chart, custom rewards that the parent sets and redeems, and 20 original potty songs with sing-along lyrics. Kid mode is a full-screen page the toddler taps themselves ("I did a wee / poo / I tried / potty song"), with a press-and-hold exit for grown-ups.
- **Sit timer** plays a potty song with lyrics during the 3 minutes.
- **Reminders:** before the likely window (5 or 10 min heads-up), after meals, at bedtime, with quiet hours overnight. Real phone notifications when allowed.
- **Your data:** everything is stored on the device. Export to a file, or delete everything.

### v5 changes
- **Settings screen:** opens when you tap the child's name (top right of every tab), not from the bottom bar. It has the child's profile, **UpAiry Plus** (trial or member status, perk progress: a free 5-pack at day 30 and a free bed mat at day 60, 15% off), Manage subscription, **Shop UpAiry** (the 9 print designs and kits, linked to upairy.com), Training settings (method, readiness check, timing, reminders), Family (add a child, invite a caregiver, share an update), and App (AI coach, replay tour, your data, start over).
- **UpAiry in the program:** each step shows "What you'll need" with the right product: 10-pack + Daytime Kit for 3-day, 5-pack for gentler methods, wet bags for "Out and about", the Nighttime Kit + bed mat for nights, soap for "Independence". There's also a **pants planner**: how many pairs you have against how many the method needs, and how often you'll need to wash, based on recent accidents.
- **Tour:** 15 steps across Today, Program, Coach, Kid zone, Progress and Settings, ending with a reminder preview.
- **Quiz:** taps no longer jump the screen to the top.

### v6: sign-in and the daily loop
**Sign-in (first screen):** "Find your UpAiry order" using either the order email, or the order number + last name + ZIP/postcode. Under that, other ways in: email me a code, I have a password, or create a free account (opens upairy.com/account/register). Then an FAQ: where to find the order number, bought from a shop or Amazon, email doesn't match, is my child's data shared. A matched order means **UpAiry Plus**; a free account gets the basics plus a "Link my order" upsell in Settings. **QA mode: any input works.** In production these call UpAiry's account service (Shopify order lookup). Settings shows the account with Sign out.

**How a parent uses the program each day:**
| When | What they do | How the app prompts it |
|---|---|---|
| Morning (~1 min) | Log the wake-up, glance at today's step | 7–10 am notification "Good morning! Today: Day 2: Bare bottom" (tap logs the wake-up). The "Morning" tile in the daily strip on Today. |
| Through the day (a few taps each time) | Offer the potty when reminded; log wee / poo / accident / nothing; log drinks, meals, naps | Potty reminders before the likely window, after-meal nudges, the "Through the day" tile showing the count |
| Evening (20 sec) | Check in: add anything missed → how it felt + tags + note → pick tomorrow's step | 6:30 pm notification "How did today go?" (only if not done). The "Evening" tile, and the check-in button on the plan card. If yesterday was missed, Today shows "Finish yesterday's check-in" until 4 pm. |

The check-in is what moves the program on. Its suggestion uses the day's numbers and the parent's mood ("tough day" holds them on the step). Each check-in is saved as a **day log** (mood, tags, note, decision), shown in Progress → History, and a check-in streak shows on the Program tab.

### v7: quiet hours and a forgiving timer
- **Quiet hours** (default bedtime 7:30 pm to 6:30 am, editable in Potty timing): no timer and no reminders. The ring shows "Quiet hours · Timer starts again at 6:30 am", and logging still works. Near bedtime, if the next try would land in quiet hours, it shows "Nearly bedtime".
- **No wake-up logged?** The day starts on its own at the end of quiet hours ("Started at 6:30 am. Log the wake-up for better timing").
- **Missed or unlogged tries:** after a 15-minute grace period the timer rolls on to the next try ("Missed one or didn't log it? No problem"). It never piles up "overdue 2 hours". After 2 missed tries in a row it stops sending reminders until the next log.
- **Pause:** a Pause button on the timer, for nap time (2 h), out for 1 h or 2 h, or the rest of today. Any wee, poo or wake-up log ends the pause, and the first try after a pause comes sooner.

### Song audio files (Suno)
Drop the MP3s into a `songs/` folder next to `index.html`, named exactly:
`potty-time-hop`, `sit-and-wait`, `the-tinkle-train`, `my-big-kid-pants`, `wash-wash-hands`, `flush-goodbye`, `tummy-talk`, `five-little-drops`, `potty-superstar`, `slow-and-steady`, `morning-wee`, `the-poo-song`, `before-we-go`, `oops-a-daisy`, `dino-stomp`, `sleepy-wee`, `countdown`, `animal-parade`, `pants-down-pants-up`, `i-did-it` (each `.mp3`).
The app plays them, loops them in the sit timer, and moves the lyric highlight through the song. Songs that use `{name}` are sung with a generic word in the audio ("you" / "little one"), since audio can't be personalised per child.

### AI in production
Parents never enter anything. The app POSTs `{question, history, context}` to `COACH_URL` (set in `index.html`, empty for now), and the server replies `{reply}`. UpAiry's server holds the API key and the coach skill (our method, tone and safety rules), and calls Claude. The server stores nothing. `context` is an anonymous summary (age range, method, step, today's counts, the 7-day success rate, learned timing, days since the last poo), never the name, notes or exact times. Until `COACH_URL` is set, answers come from the built-in guides.

### Songs in production
The 20 songs have original lyrics written for UpAiry and simple melodies played in the browser. For the real app, record or generate proper versions (a music model, or a session singer) with the same lyrics.

---

## 3. Later
- **UpAiry rewards ladder** (free training pants at month 1, bed mat at month 2–3, codes on streaks)
- Caregiver sync with roles (owner / can log / view only)
- Push notifications, lock-screen Live Activity, Apple Watch, Siri
- Kid sticker chart and potty-time game
- Better prediction (nap-aware, weekday vs weekend)

## 4. Build path
1. **Now:** `index.html` prototype. Test it with 5–10 parents mid-training: do they finish onboarding, log every day, and trust the timer?
2. **MVP:** React Native / Expo, local-first storage, real notifications, subscription.
3. **v2:** caregiver sync, watch and widgets, UpAiry rewards.
