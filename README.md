# UpAiry Potty

Potty training app for UpAiry customers. It gives parents a personal program (3-day, bare bottom, gentle or nights), a timer that learns the child's rhythm, one-tap logging from reminders, an evening check-in, a coach, a kid zone and UpAiry membership perks. The child's data stays on the phone.

## What's here
| Path | What it is |
|---|---|
| `app/` | The real app: Expo (React Native) for iPhone and Android |
| `index.html` | The original clickable web prototype |
| `APP_MAP.md` | Product map, competitor review and feature decisions |
| `USAGE_ANALYSIS.md` | How parents actually use it, gaps, and the launch path |
| `start-phone.cmd` / `start-phone-tunnel.cmd` | Run the app on your phone in Expo Go (Windows) |
| `expo-login.cmd` | Sign in to Expo for cloud builds |

## Running it
The app needs Node 22+. On Windows the scripts use a portable Node in `.tools/`, which isn't committed. To recreate it, download the Node 24 LTS Windows zip from nodejs.org and unzip it into `.tools/`. For cloud builds, install the Expo build tool there too: `cd .tools && mkdir eas && cd eas && npm init -y && npm install eas-cli`. Then:

```
cd app
npm install
npx expo start --tunnel ngrok
```

Scan the QR code with Expo Go.

## Inside the app
- `src/app/`: screens (Expo Router). Tabs: Today, Program, Coach, Kid zone, Progress, plus Settings.
- `src/lib/logic.ts`: stats, learned timing, the forgiving timer, quiet hours, program rules.
- `src/lib/content.ts`: programs, coach guides, songs, products (copy from the prototype).
- `src/lib/notifications.ts`: reminders with log buttons, rebuilt whenever the logs change.
- `src/lib/coach.ts`: the `COACH_URL` for the AI coach server (empty until it's live).

## Still to wire up
- Sign-in accepts any input (QA mode). It needs to connect to Shopify order lookup.
- AI coach server and skill (`COACH_URL`).
- Suno song audio (`songs/<slug>.mp3`, filenames listed in `APP_MAP.md`).
- Subscriptions (App Store / Play billing), and caregiver sharing.
- Expo project: `upairy/upairy-potty-app`.
