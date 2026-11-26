# Notes for Apple App Review (reply to Guideline 2.1, Information Needed)

This is the text for App Store Connect > version page > App Review Information > Notes.
It goes ABOVE the demo login lines that are already in that box. Replace the video line with the real link.

---

1. SCREEN RECORDING
Recorded on a physical iPhone running the latest iOS, starting from launching the app: [VIDEO LINK]
It shows: first launch and Get started (no account needed), setup, the timer and one-tap logging, the daily program, the coach, kid mode with the sticker chart and songs, progress, the optional sign-in with the demo account, an AI coach answer, and Settings > Delete my account and data.

2. PURPOSE AND AUDIENCE
Potty Up is for parents and carers who are potty training a toddler. The problem: parents don't know what to do each day or when to offer the potty. The app gives a day-by-day plan for the method they choose, a timer that learns the child's rhythm from their logs and reminds the parent when to offer the potty, a coach to ask questions, and a sticker chart, rewards and songs that keep the child motivated. The app is used by adults; children only see kid mode on the parent's phone.

3. HOW TO USE IT
No account is needed. Launch the app, tap "Get started", and complete the short setup (child's name, age, method). Then:
- Today: the countdown to the next potty try and one-tap logging (wee, poo, accident, drink, meal).
- Program: the daily lesson and steps for the chosen method.
- Coach: ask Lara a question. Without sign-in, answers come from the built-in guides.
- Kid: sticker chart, stars, rewards and potty songs.
- Progress: success rate, accidents and dry nights.
Optional sign-in: Settings > Sign in, or "I have an UpAiry order: sign in" on the welcome screen. Use the demo account given below. Signing in adds AI answers from the coach and a private backup of the family's data.
Account deletion: Settings > "Delete my account and data" (deletes the account and all stored data straight away).
The app has no in-app purchases and no user-generated content that other users can see. Logs and notes are private to the family.

4. EXTERNAL SERVICES
- Supabase: database, sign-in and the optional private backup.
- Anthropic (Claude): generates the AI coach's answers for signed-in users. The app asks for consent before the first question is sent.
- Shopify and Loop Subscriptions: used only to check that a signed-in customer has a Potty Up membership from upairy.com. Shopify's CDN also hosts the song audio files.
- Expo (EAS Update): delivers app updates.
- Apple: local notifications for reminders, Live Activities for the lock-screen timer, and the App Store review prompt.
No advertising or tracking SDKs.

5. REGIONAL DIFFERENCES
None. The app works the same in every region. It is in English only.

6. REGULATED INDUSTRY AND THIRD-PARTY MATERIAL
The app is not a medical app and does not operate in a regulated industry. It gives general parenting guidance and says so in the app ("General guidance, not medical advice"). All written content, artwork and songs were created for UpAiry and are owned by UpAiry Limited. No third-party protected material is used.
