<p align="center"><img src="app/assets/brand/logo-green.png" alt="UpAiry" width="220"></p>

# Potty Up

**Potty Up: Potty Training** is a potty training app for parents of toddlers, made by **UpAiry**, the makers of reusable potty training underwear ([upairy.com](https://upairy.com)). This README explains what the app does, how it works, what's finished and what's still to connect.

## TL;DR
- **Personal program:** 3-day intensive, bare bottom at home, gentle, or nights, chosen from a readiness quiz and moved on by a daily check-in
- **Smart potty timer:** learns the child's own rhythm from logs, comes sooner after drinks and waking, and forgives missed logs
- **Reminders with log buttons:** tap "Wee on the potty / Nothing / Accident" right on the notification
- **Quiet hours and pause:** no reminders overnight, pause for naps and outings
- **One-tap logging:** wee, poo, accident, tried, plus drinks, meals and wake-ups, and who started it
- **20-second evening check-in:** add missed logs, say how the day felt, plan tomorrow
- **Night training:** dry or wet nights, the last drink against bedtime, a 14-night trend
- **Coach:** 8 offline "right now" guides with the words to say, plus an AI coach (via UpAiry's server, anonymous data only)
- **Kid zone:** stars, sticker chart, rewards the parent sets, kid mode, a sit timer, 20 original potty songs
- **Progress:** what the app has learned about the child, success trends, accident times, a full history calendar
- **Handover:** a one-tap update for grandparents or daycare
- **Potty Up is sold on upairy.com:** a product in the Shopify cart, billed by Loop (7-day trial). Signing in with the checkout email unlocks the full app, 15% off at upairy.com, and a shop matched to each program step
- **Private:** child data stays on the phone, with no ads or tracking
- **Platforms:** iPhone and Android (Expo / React Native), plus a web preview

Store name, subtitle, keywords and description: see [STORE_LISTING.md](STORE_LISTING.md).

## Try it

| Where | Link | Notes |
|---|---|---|
| **Web (any browser)** | https://upairy-potty.expo.app | Everything except notifications. Data stays in that browser. |
| **Android phone** | [Latest test build](https://expo.dev/accounts/upairy/projects/upairy-potty-app/builds/657242c0-bc80-4850-ad46-cb73f183cb6a) | Download on the phone and allow "install from unknown sources". Full app with reminders. |
| **iPhone** | Coming via TestFlight | Waiting on Apple developer approval. |

**Sign-in:** the email and order number from an upairy.com order (no password, no emailed code). Choose **Explore with a sample week** during setup to see the app full of example data.

## Contents
1. The daily loop · 2. Getting started · 3. Programs · 4. Smart timer · 5. Logging · 6. Notifications · 7. Night training · 8. Coach and AI · 9. Kid zone · 10. Progress · 11. Settings and UpAiry · 12. Privacy · 13. Built vs. to do · 14. Technical overview · 15. Running it yourself

---

**What it is:** a potty training app for parents of toddlers, made by UpAiry (makers of reusable potty training underwear). It turns potty training into a simple daily routine. The parent follows a personal program, the app tells them when to offer the potty, they log what happens in a few taps, and a 20-second evening check-in plans tomorrow.

**Who it's for:** parents (and grandparents, nannies, daycare) of children about 18 months to 4 years. It's built for one-handed use in the middle of a messy day.

**Platforms:** iPhone and Android (one Expo / React Native codebase). It also runs in a web browser for previews, without notifications.

**Status:** a working app. An Android test build exists and the iPhone (TestFlight) build is waiting on Apple's developer approval. Some backend pieces are still placeholders (see section 12).

---

## 1. The daily loop (the core idea)

Every screen supports one routine:

| When | Parent does | App does |
|---|---|---|
| **Morning** (1 min) | Logs the wake-up | Starts the timer and shows today's program step. A morning notification can log the wake-up in one tap. |
| **Through the day** (a few taps each time) | Offers the potty when reminded, then logs what happened | Sends a reminder a few minutes before the child is likely to need to go. The reminder has buttons: *Wee on the potty / Sat, nothing came / Accident*. |
| **Evening** (20 sec) | Does the check-in | Adds anything missed, records how the day felt, and suggests whether to move on, repeat or step back tomorrow. |

A three-tile strip at the top of the Today screen (Morning, Through the day, Evening) ticks off as each part is done, so the parent always knows what's next. If yesterday's check-in was missed, Today shows "Finish yesterday's check-in" until 4 pm.

---

## 2. Getting started

### Sign-in (first screen)
- **Email + order number.** The `order-signin` server function checks in Loop that the order number belongs to that email, then signs the parent in (UpAiry's own accounts, via Supabase). No password and no emailed code. Failed tries are limited to 8 an hour per email, so order numbers can't be guessed.
- **Access list (team, testers, gifts):** people in the `manual_access` table sign in with their email and an access number instead of an order number, and get Potty Up as a gift. Nothing is created in Shopify or Loop, so no emails are sent. Add someone in Supabase → Table editor → `manual_access` (email, a 6-digit access number, a note).
- **Unlocking Potty Up:** after sign-in, the server asks Loop whether that email has an active Potty Up subscription. If it does, the full app unlocks. This is rechecked every 6 hours, so cancellations take effect.
- **No buy button in the app** (Apple's rules for apps that unlock a web purchase). Parents buy Potty Up on upairy.com.
- **FAQ** on the screen: where to find the order number, which email to use, bought Potty Up but it says free, is my child's data shared.

### Setup (about a minute)
1. Child's name, age range, and the words they use for wee and poo. These are shared with caregivers so everyone says the same thing.
2. **Where are they now?** Still in nappies / sits on the potty sometimes / uses it sometimes / dry in the day (goes straight to night training).
3. **Readiness check:** 8 questions in three groups (body, understanding, interest), each answered *Yes, clearly / Sometimes / Not yet*, scored as a %. Plus "Can you spend 3 days at home soon?"
4. **Choose a method.** One is suggested from the answers, and the parent can pick another (see section 3).
5. **Their program:** every step listed, with steps the child has already passed marked as skipped.
6. **Start fresh, or explore with a sample week** (7 days of example logs, for demos).
7. Permission to send notifications.

### Intro walkthrough
Five screens shown once after setup, and replayable from Settings: the daily routine, logging from reminders, how the timer learns, how the program moves on, and where everything lives.

---

## 3. Programs (personalised plans)

Four methods, each a list of steps. Each step has a length in days, how often to offer the potty, a short daily checklist, what to expect, and a **goal** that must be met to move on.

| Method | For | Steps |
|---|---|---|
| **3-day intensive** | Ready children, 3 days at home | Get ready → Day 1 bare bottom (every 15 min) → Day 2 (every 20) → Day 3 first outing (every 30) → Pants on, days 4–7 (every 45) → Out and about → Independence |
| **Bare bottom at home** | Works around daycare | Get ready → Bare-bottom mornings → Bare bottom all day → Pants on at home → Out and about → Independence |
| **Gentle, child-led** | Not quite ready yet | Potty in the routine (no timer) → Pants mornings → Pants all day → Out and about → Independence |
| **Nights** | Dry in the day | Watch dry mornings → Bedtime routine → Nappy-free nights → 7 dry nights |

**Example goals:** "at least 3 wees on the potty in a day", "60% of wees on the potty", "80% on the potty and telling you first", "4+ dry mornings in a week".

### How it moves forward
- **Only the evening check-in moves the program on.** It looks at the day's numbers against the step's goal and suggests *Move on*, *Repeat this step tomorrow* or *Go back a step*. The parent chooses.
- If the parent says the day was **tough**, it suggests staying put even when the numbers look fine.
- **Guardrails** (so the program can't be rushed):
  - A check-in before 4 pm asks "Check in early? The day isn't over yet".
  - "Move on anyway" when the goal wasn't met explains the risk and asks to confirm.
  - Future steps show as "Later". Skipping ahead shows the goal and a warning, then asks to confirm.
  - Switching method asks first, because it restarts the program. Logs and learned timing are kept.
  - Going back a step is always instant.

---

## 4. The smart timer

The big countdown ring on Today: "Next potty try: 23 min, around 4:20 PM", with a line saying *why*.

### How it decides
1. **Starting timing** comes from the current program step (e.g. every 15 min on Day 1).
2. **It learns the child's own rhythm** from their logs. After 6 timed gaps between wees it switches to the child's typical gap, worked out separately for mornings and afternoons. A banner shows progress ("Learning Otto's rhythm, 3 of 6"), and a message appears when it's learned.
3. **Drinks bring the next try forward.** By default that's 35 min after a drink, until it learns the child's own drink-to-wee time.
4. **Waking up** (morning or nap) triggers a try soon after, also learned.
5. It never stretches more than 1.6× past what the current step allows, so it can't jump too far too early.
6. The parent can switch to a **fixed interval** (15–90 min) instead.

### Forgiving by design
- **Quiet hours** (default 7:30 pm–6:30 am, adjustable): no timer and no reminders. The ring says "Quiet hours · Timer starts again at 6:30 am".
- **Nearly bedtime:** if the next try would land in quiet hours, it says so instead of counting down.
- **No wake-up logged?** The day starts on its own at the end of quiet hours.
- **Missed or unlogged a try?** After 15 minutes of grace it moves on to the next try ("Missed one? No problem") instead of showing "overdue 2 hours".
- **After 2 missed tries in a row,** reminders stop until the parent logs again. No nagging.
- **Pause:** nap time (2 h), out for 1 or 2 h, or rest of today. Any log ends the pause.

---

## 5. Logging

- **Log potty sheet:** what happened (on the potty / accident / sat, nothing), what (wee / poo / both), who started it (*they told me* / *I offered*), and when (now, or 5, 15 or 30 min ago).
- **"Told you first"** is tracked because it's the best sign training is clicking.
- **One-tap logs:** Drink, Meal, Woke up.
- **From notifications:** buttons on each reminder log straight away.
- **Undo** on every log (in the confirmation message), and delete from the timeline.
- **The evening check-in** can add missed logs ("+ On the potty", "+ Accident", "+ Poo on the potty").
- **Timeline** of the day, showing how long since the last wee.
- **Poo watch:** after 2+ days with no poo it shows an alert with what helps (holding in poo is the most common snag), using the child's usual poo time if known.

---

## 6. Notifications

All scheduled on the phone itself and rebuilt every time something is logged, so they always follow the current timer.

| Reminder | When | Buttons |
|---|---|---|
| Potty try | 5 or 10 min (the parent's choice) before the likely window, for the next 2 tries | Wee on the potty / Sat, nothing came / Accident |
| After-meal sit | 20 min after a logged meal | Same as above |
| Bedtime wee | 15 min before bedtime | none |
| Morning plan | Next morning, after quiet hours | Woke up now |
| Evening check-in | 6:30 pm if not done, and the next day | Check in |

Each type can be turned on or off in Settings → Reminders. Quiet hours and pauses are always respected, and there's a "Preview a reminder" button for testing.

---

## 7. Night training

The Today screen has a Daytime / Night switch. Night shows:
- **Last night:** woke up dry / wet night (one tap), and the dry streak.
- **Last 14 nights** strip, with "X of 7 dry this week".
- **Tonight:** the last drink against bedtime ("1 h 45 min before bed. Good."), the double wee, and having the bed mat and spare sheets ready.
- **Guidance:** night dryness depends on a hormone, not effort. 4+ dry mornings a week means they're likely ready.

---

## 8. Coach

### "Right now" guides (work offline)
Eight situations, each with numbered steps and **the exact words to say**:
refusing to sit · just had an accident · holding in poo · out in public · wet nights · going backwards (regression) · scared of the toilet · too busy playing.

### AI coach
- A chat where the parent can ask anything, with suggested questions such as "Is it normal to have this many accidents?".
- **How it will work:** the app sends the question, the recent chat and an **anonymous summary** of the child's data to **UpAiry's server**. The server holds the API key and the UpAiry coach skill (method, tone and safety rules), calls the AI model, and returns the answer. Parents never enter keys or set anything up.
- **What the AI sees:** age range, method and step, today's counts, the 7-day success rate by day, learned timing, and days since the last poo. **Never** the child's name, notes or photos. The conversation is stored on the phone only.
- **Safety rules for the skill:** calm and practical; no punishment, shaming or forcing; points to a doctor for red flags (no poo 4+ days, pain or blood, fever or burning, sudden regression).
- *Current state:* the server isn't live yet (`COACH_URL` is empty), so answers come from the matching built-in guide, labelled as such.

### Guides
Short articles: holding in poo, when it goes backwards, daycare and grandparents, out and about.

---

## 9. Kid zone (for the child)

- **Stars:** 2 for a wee or poo on the potty, 1 for trying, 3 for a dry night.
- **Sticker chart:** 30 stickers, one new sticker for every success. Pages continue after 30.
- **Rewards the parent sets:** e.g. "Pick the bedtime story" for 6 stars, "Ice cream after dinner" for 15, "Trip to the park" for 25. Redeeming one shows a "Reward time!" celebration.
- **Kid mode:** a full-screen page to hand to the toddler, with big buttons: *I did a wee / I did a poo / I sat and tried / Potty song*. Each tap logs it and shows a star burst. Grown-ups exit by pressing and holding.
- **Sit timer:** a 3-minute countdown with a potty song and sing-along lyrics. It ends with "They went!" or "Nothing came", which logs it.
- **20 original potty songs**, written for UpAiry: Potty Time Hop, Sit and Wait, The Tinkle Train, My Big Kid Pants, Wash Wash Hands, Flush Goodbye, Tummy Talk, Five Little Drops, Potty Superstar, Slow and Steady, Morning Wee, The Poo Song, Before We Go, Oops-a-Daisy, Dino Stomp, Sleepy Wee, Countdown, Animal Parade, Pants Down Pants Up, I Did It! Some use the child's name in the lyrics. Parents can favourite songs.
  - *Current state:* the lyrics are in. Audio will be produced in Suno and dropped in as `songs/<song-name>.mp3`.
- **Celebrations:** confetti and a big star after every success.

---

## 10. Progress

### Insights
- **What we've learned about the child:** time between wees (mornings and afternoons), wee after a drink, wee after waking, usual poo time. Each has a confidence bar until there's enough data.
- **Numbers:** success rate this week (first day → today), % told you first, accidents a day, days logged.
- **Charts:** success rate by day, and when accidents happen (an hour-by-hour heatmap), with a tip ("Most accidents happen around 3 pm. Offer the potty 15 minutes before").

### History
- A month calendar with each day's success % and dots for wins and accidents.
- Tap a day to see its numbers, night result, **check-in** (mood, tags, note, decision) and full timeline.

---

## 11. Settings (tap the child's name, top right of every screen)

- **Child profile:** name, age and words, all editable.
- **Potty Up card:**
  - "Unlocked" or "free version".
  - 15% off at upairy.com while they have Potty Up.
  - Manage or cancel on upairy.com.
  - Free accounts see "Check my purchase" instead.
- **Account:** the linked email or order, and sign out.
- **Shop UpAiry:** the 9 print designs (Trucks, Planes, Safari, Puppies, Unicorn, Whale, Bears, Ladybug, Space) and kits, each opening upairy.com: 10-pack, Daytime Kit, Nighttime Kit, bed mat + wash bag, wet bags, kids' soap.
- **Training:** method, readiness check, potty timing and quiet hours, reminders.
- **Family:** add a child and invite a caregiver (coming soon), and share an update.
- **App:** how the app works (replay the intro), AI coach info, your data (export), delete everything.

### UpAiry products inside the program
- **"What you'll need"** on the Program tab changes with the step: the 10-pack + Daytime Kit for 3-day, wet bags for outings, the Nighttime Kit + bed mat for nights, soap for the last step.
- **Pants planner:** how many training pants the parent has against how many the method needs, and how often they'll need to wash, based on recent accidents.

### Share an update
A text-ready handover for grandparents or daycare, sent through the phone's share menu: last wee, next try, today's counts, last poo, program step, the child's words, and what to do after accidents.

---

## 12. Privacy and data
- **The child's data lives on the phone**, and is **backed up to the parent's account** (Settings → Back up to my account, on by default). Signing in on a new phone restores it. Only that account can read its backup (row-level security), it's deleted with the account, and backup can be turned off (which deletes the server copy). No ads or tracking.
- The UpAiry account holds only the parent's email and whether they have Potty Up.
- The AI coach receives an anonymous summary only (section 8).
- Export everything (share as a file) or delete everything from Settings.

---

## 13. What's built vs. still to connect

| Area | Status |
|---|---|
| All screens, programs, timer, logging, check-in, night, coach guides, kid zone, progress, settings, shop links | Built |
| Native reminders with log buttons, quiet hours, pause | Built (being tested on Android) |
| Android test build (APK) | Built |
| iPhone build / TestFlight | Waiting on Apple developer approval |
| Sign-in → Shopify order lookup | Placeholder (accepts any input) |
| AI coach server + UpAiry coach skill | Placeholder (built-in guides answer for now) |
| Song audio (Suno) | Lyrics in, audio to come |
| Subscriptions (App Store / Play billing, e.g. via RevenueCat) | To do |
| Caregiver sync (shared family), multiple children | To do |
| Home-screen widgets, Apple Watch, Siri | Later |

---

## 14. Technical overview (for developers)

- **Stack:** Expo SDK 58, React Native 0.88, TypeScript, Expo Router (tabs + modal), react-native-svg, expo-notifications, expo-sqlite (on-device storage), expo-web-browser, Poppins + Chewy fonts.
- **Repo layout:**
  - `app/`: the mobile app (`src/app` screens, `src/components`, `src/lib`).
  - `index.html`: the original clickable prototype.
  - `APP_MAP.md` and `USAGE_ANALYSIS.md`: product thinking.
- **Key files:**
  - `src/lib/logic.ts`: stats, learned timing, timer state, quiet hours, program rules, check-in decisions.
  - `src/lib/content.ts`: programs, coach guides, songs, products.
  - `src/lib/notifications.ts`: scheduling and button handling.
  - `src/lib/store.ts`: state, saved on the device after every change.
  - `src/lib/coach.ts`: `COACH_URL` for the AI server.
- **Builds:** EAS (Expo cloud). The `preview` profile makes an installable Android APK; `production` is for store builds. Project: `upairy/upairy-potty-app`.
- **Run locally:** see section 15 below.

---

## 15. Running it yourself

### Repo layout
| Path | What it is |
|---|---|
| `app/` | The real app: Expo (React Native) for iPhone, Android and web |
| `index.html` | The original clickable web prototype (open it in a browser) |
| `APP_MAP.md` | Product map, competitor review and feature decisions |
| `USAGE_ANALYSIS.md` | How parents actually use it, gaps, and the launch path |
| `start-phone.cmd` / `start-phone-tunnel.cmd` | Windows: run the app on a phone in Expo Go |
| `expo-login.cmd` | Windows: sign in to Expo for cloud builds |
| `app/scripts/make-icons.py` | Rebuilds every icon and in-app logo from `app/assets/brand/upairy-wordmark.png` |

### Develop
Needs **Node 22+**. On Windows the scripts use a portable Node 24 in `.tools/`, which isn't committed.

```
cd app
npm install
npx expo start                  # scan the QR code with Expo Go
npx expo start --tunnel ngrok   # if the phone can't reach the computer
npx tsc --noEmit                # typecheck
npx eslint src                  # lint
```

### Build and publish (Expo cloud, project `upairy/upairy-potty-app`)
Keep the build tool (`eas-cli`) **outside** `app/`. Installed inside the app, it clashes with the app's TypeScript version and breaks cloud installs. Install it globally or in a separate folder.

```
eas build --platform android --profile preview        # installable test APK
eas build --platform ios --profile production         # TestFlight / App Store (needs Apple developer account)
npx expo export --platform web && eas deploy --prod   # update the web version
```

---

## Updating the coach playbook

The AI coach's knowledge lives in [`coach-playbook/`](coach-playbook/), one Markdown page per topic. The pages are researched from NHS, NICE, AAP, ERIC, Kids Health NZ, children's hospitals and real parent threads. How the coach *behaves* (tone, safety, length) is in `supabase/functions/coach/skill.ts`.

To change what the coach knows:
1. Edit or add a page in `coach-playbook/` (files starting with a number are included, in order).
2. Run `python scripts/build-playbook.py`. It writes `supabase/functions/coach/playbook.md`.
3. Paste that file's contents into Supabase → Table editor → `coach_content` → row `playbook` → `body`. The coach picks it up within 10 minutes. No redeploy needed.

The playbook (about 16k words) is sent with every question but cached for an hour, so repeat questions read it at about a tenth of the normal price.
