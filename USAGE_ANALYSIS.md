# UpAiry Potty: how parents will actually use it, and what's next

## 1. A real week, minute by minute

**The parent:** mid-30s, toddler aged 2½, a partner and maybe daycare. They bought UpAiry pants because training is stressful. They're doing a 3-day method over a long weekend, holding the phone in one hand, often with wet hands and a child pulling at them.

| Moment | What really happens | What the app does today | Gap |
|---|---|---|---|
| **Night before** | Downloads the app after the order email, sets it up on the couch | Sign-in, 6 setup steps, 16-step tour | **Too long for a tired parent.** Sign-in + setup is fine; the tour should be optional and short (3 tips), with tips appearing in context later |
| **Day 1, 7 am** | Toddler wakes, nappy off, chaos | Morning nudge, "Woke up" tile | Fine |
| **Day 1, every 15 min** | Timer goes off ~30 times. Parent is cleaning, cooking, chasing | Reminder banner, then open the app → Log potty → 3 choices → Save | **Biggest gap: logging takes 4 taps inside the app.** Real parents won't open the app 30 times. They need **buttons on the notification itself** (Wee ✓ / Accident / Nothing) and a lock-screen countdown |
| **Day 1, accident on the rug** | Cleans up first, remembers to log 20 min later, or never | "When: 5/15/30 min ago" chips, plus "anything you missed?" at check-in | Good. Also add a "log it later" swipe on the notification |
| **Day 1, 3 pm** | Partner takes over, doesn't have the app or isn't signed in | Share text update | **Second biggest gap: one phone per family.** Partner logs go nowhere. Needs caregiver sync (shared family) |
| **Day 1, 7 pm** | Exhausted. 8 accidents. Feels like failing | Evening check-in, "tough day" keeps them on the step | Good. The tone should be warmer on tough days ("Day 1 is meant to be messy") |
| **Day 2–3** | Rhythm forms. Logs most things | Learned timing kicks in after 6 gaps | Good. Show the moment it learns ("We've got Otto's rhythm: every 47 min") as a small celebration |
| **Day 4–7** | Pants on. Fewer accidents. **Parent stops logging successes because it's going well** | Assumes logs are complete | **Third gap: logging decays as training succeeds.** Switch to "exceptions mode": only log accidents, and confirm "mostly dry?" at check-in. Don't punish the data gap |
| **Week 2** | Daycare Monday to Friday, 8 hours with no logs | Timer is lenient, history shows gaps | Daycare day toggle: "At daycare today", with no timer, and a daycare report the teacher fills in (link, no app) |
| **Week 3+** | Daytime mostly done. **Why open the app?** | Night program, rewards, songs | **Retention cliff.** Real reasons to stay: night training, regressions (new sibling, illness), poo withholding, sibling #2, UpAiry gear perks |
| **2 am** | Wet bed. Phone at 5% brightness | Night tab | One-tap "Wet night" from the lock screen or notification; dark by default at night |

## 2. What matters most, ranked

1. **Log from the notification or lock screen** (native only). Tap "Wee ✓" on the reminder and it's done. This one feature decides whether parents log on day 1.
2. **Family sync.** Two parents and a grandparent on one child. Daycare gets a link (no app) to log or read the day.
3. **A shorter first run.** Keep sign-in and setup; replace the 16-step tour with 3 tips, then contextual tips.
4. **Exceptions mode** once things are going well: log accidents only, one-tap "mostly dry today".
5. **Daycare and out-of-home days:** a toggle that pauses the timer and marks the data gap as expected.
6. **Notification controls:** Day 1 can be 30+ reminders. Offer vibrate-only, a "mute for 1 hour" action, and the quiet hours already built.
7. **Warmer feedback at the right moments:** first learned rhythm, first "told me first", first dry day, first dry night. Small, not gamified noise.
8. **Retention after daytime:** a night program push at the right time, regression support, a "next child" restart, and UpAiry perks (free pants, bed mat).
9. **Coach answers in the moment:** the "right now" cards are good; add them to notifications ("Refused 3 times? Here's what to try").
10. **Trust and privacy:** child data stays on the phone (done). Spell it out in the App Store privacy label.

## 3. What to measure in a test (with 10–20 real parents)

- Setup completion rate, and time to first log
- Logs per day on days 1–3 compared with days 4–7 (watch the decay)
- Check-in completion rate (the core habit)
- How many reminders a day get acted on, and how many get ignored
- Day 7 and day 21 retention
- Did they reach "daytime done"? How many days did it take?
- Interviews: "When did you stop logging, and why?"

## 4. Running it on a phone without the App Store (this week)

Yes. Turn it into a **web app (PWA)** and host it, for example at `app.upairy.com`. Parents open the link and tap "Add to Home Screen", and it opens full-screen with an icon like a real app.

| Works as a web app | Doesn't work (or only partly) |
|---|---|
| Everything you see now: logging, timer, program, check-in, coach, songs, kid mode, shop links | **Reminders while the app is closed.** On iPhone, web push only works after "Add to Home Screen" (iOS 16.4+), and it has to be sent from a server at the right times. The phone can't schedule it locally |
| Works offline, and data stays on the device | Buttons on notifications, lock-screen countdown, widgets, Apple Watch |
| Instant updates, no review | Being found in the App Store |

**Good for:** a beta with 10–50 parents, to test whether the daily loop works. **Not enough for:** launch, because reminders are the product.

What's needed for the web-app beta: a manifest + icon + offline service worker (an hour), hosting (Netlify, Vercel or Shopify), and optionally a small push server so reminders arrive with the app closed.

## 5. Getting into the App Store and Google Play

**Build:** rebuild this prototype in **React Native with Expo**. It's one codebase for iPhone and Android, and the screens carry over closely. Native features: local scheduled notifications with action buttons, a Live Activity countdown, widgets. Subscriptions through RevenueCat. Shopify order lookup through a small server, which also hosts the AI coach.

**Rough timeline (one experienced developer):**
| Phase | Time |
|---|---|
| Native app from this prototype (screens, storage, notifications) | 3–5 weeks |
| Accounts + Shopify order matching + subscriptions | 1–2 weeks |
| AI coach server + coach skill | ~1 week |
| TestFlight / closed beta with parents | 2 weeks |
| Store submission | see below |
| **Total to launch** | **about 8–10 weeks** |

**Store review times:**
- **Apple:** review usually takes 1–2 days. Budget 1–2 weeks for a first app, because first submissions often get one or two rejections to fix (privacy labels, subscription wording, account deletion, a demo account for the reviewer). An Apple Developer account costs US$99 a year. Enrol as an organisation, which needs a D-U-N-S number and can take a week or two, so **start this now**.
- **Google Play:** a US$25 one-time fee. New *personal* developer accounts must run a closed test with 12+ testers for 14 days before going public. An *organisation* account avoids that (it also needs a D-U-N-S number). Review takes hours to a few days.

**Store gotchas to plan for:**
- **Subscriptions bought inside the app must use Apple and Google in-app purchase.** Unlocking UpAiry Plus for people who bought pants on upairy.com is generally allowed, but the app should also offer the subscription by in-app purchase. Confirm the exact wording against Apple guideline 3.1 before you build the paywall.
- **Category:** list it under Health & Fitness or Education as an app *for parents*, not in the Kids category. Kid mode is fine as a feature, but being "directed at children" brings strict rules.
- **Account deletion** must be possible inside the app (we have "Delete everything"; add account deletion).
- **Privacy label:** "Data not collected" for child data is a real selling point. Only the account email and order are linked to the parent.
- **AI coach:** label it as general guidance, not medical advice (done), and report it in the AI-related disclosures.

## 6. Suggested next steps, in order
1. **This week:** make it an installable web app, host it, and put it in the hands of 10–20 UpAiry customers. Start the Apple and Google organisation enrolment (D-U-N-S) in parallel.
2. **Fix from real use:** shorter first run, exceptions mode, daycare toggle.
3. **Brief a developer, or an Expo build here:** the native app with notification actions and family sync.
4. **Back end:** Shopify order lookup, AI coach server with your skill, push.
5. **Content:** record the 20 songs in Suno, write the coach skill, and finalise the perk rules (day 30 and day 60).
6. **Beta through TestFlight / closed testing → launch.**
