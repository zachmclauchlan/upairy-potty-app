// Native reminders. Rebuilt from the timer whenever the logs change, so they follow the child's rhythm,
// respect quiet hours and pauses, and stop after two missed tries (see timerState).
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { S, MIN, sod, addDays, atHour } from './store';
import { fmt, item, onDay, isPotty, predict, quietNow, timerState } from './logic';
import { logPotty, logQuick } from './actions';
import { emit } from './bus';
import { toast } from '@/components/ui';
import { syncLockTimer } from './lockTimer';

export const supported = true;

export async function initNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', { name: 'Potty reminders', importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 200, 120, 200] });
  }
  // Buttons on the notification. Identifiers avoid ":" and "-" as the docs require.
  // On iPhone the log buttons work without opening the app: one tap from the lock screen (or an Apple Watch) and it's logged.
  // On Android a button tap still opens the app, which is what delivers the tap to us there.
  const quick = { opensAppToForeground: Platform.OS !== 'ios' };
  await Notifications.setNotificationCategoryAsync('potty', [
    { identifier: 'logwee', buttonTitle: 'Wee on the potty', options: quick },
    { identifier: 'lognothing', buttonTitle: 'Sat, nothing came', options: quick },
    { identifier: 'logaccident', buttonTitle: 'Accident', options: quick },
  ]);
  await Notifications.setNotificationCategoryAsync('morning', [
    { identifier: 'logwake', buttonTitle: 'Woke up now', options: quick },
  ]);
  await Notifications.setNotificationCategoryAsync('evening', [
    { identifier: 'opencheckin', buttonTitle: 'Check in', options: { opensAppToForeground: true } },
  ]);
}

export async function permission(ask: boolean) {
  const s = await Notifications.getPermissionsAsync();
  if (s.granted || !ask) return s.granted;
  const r = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: true } });
  return r.granted;
}

const handled = new Set<string>();
/** Runs when the parent taps a notification or one of its buttons. */
export function handleResponse(r: Notifications.NotificationResponse) {
  const key = r.notification.request.identifier + r.actionIdentifier + r.notification.date;
  if (handled.has(key)) return; handled.add(key);
  const a = r.actionIdentifier;
  const nm = S.child.name || 'Logged';
  if (a === 'logwee') { logPotty('success', 'wee'); toast(`${nm}: wee on the potty`, 'Logged from your reminder'); emit('celebrate'); }
  else if (a === 'lognothing') { logPotty('tried', null); toast('Logged: sat, nothing came', 'Practice still counts'); }
  else if (a === 'logaccident') { logPotty('accident', 'wee'); toast('Accident logged', "No worries. That's how they learn."); }
  else if (a === 'logwake') { logQuick('wake'); toast('Good morning!', `Today: ${item().t}. The timer has started.`); }
  else if (a === 'opencheckin' || r.notification.request.content.categoryIdentifier === 'evening') {
    const day = Number((r.notification.request.content.data as any)?.day) || sod(Date.now());
    emit('checkin', day);
  }
  // A log from a button may arrive with the app in the background, where no screen is watching for changes:
  // rebuild the reminders and the lock-screen timer here so both follow the new log.
  if (a === 'logwee' || a === 'lognothing' || a === 'logaccident' || a === 'logwake') setTimeout(() => { reschedule(); syncLockTimer(); }, 400);
  // so the same tap isn't handled again the next time the app starts
  Notifications.clearLastNotificationResponseAsync?.().catch(() => {});
}

/** Remove every scheduled reminder (sign-out, account deletion). */
export async function cancelAll() { await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {}); }

let busy = false, again = false;
/** Cancel and rebuild every scheduled reminder from the current state. */
export async function reschedule() {
  if (!S.onboarded || !S.account) return;
  if (busy) { again = true; return; }
  busy = true;
  try {
    if (!(await permission(false))) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    const now = Date.now(), today = sod(now), nm = S.child.name || 'Your child';
    const at = async (ts: number, title: string, body: string, categoryIdentifier?: string, data?: Record<string, unknown>) => {
      if (ts <= now + 30 * 1000) return;
      await Notifications.scheduleNotificationAsync({
        content: { title, body, categoryIdentifier, data, sound: true, ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}) } as any,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(ts), ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}) } as any,
      });
    };
    // potty tries: the next one and one after, then stop until the parent logs again.
    // If paused or in quiet hours right now, plan the first try for when that ends.
    let p = predict();
    if (!p) {
      const s = timerState();
      if (s && s.state !== 'run') { const r = timerState(s.until + MIN); if (r?.state === 'run') p = r; }
    }
    if (S.rem.on && p && p.missed < 2) {
      for (let k = 0; k < 2 - p.missed; k++) {
        const due = p.due + k * p.gap * MIN, fire = due - S.rem.lead * MIN;
        if (quietNow(fire) || quietNow(due)) break;
        await at(fire, `${nm} may need to go soon`, `Good time to offer the potty, around ${fmt(due)}.`, 'potty');
      }
    }
    // after-meal sit
    const meal = [...onDay(today, e => e.type === 'meal')].pop();
    if (S.rem.meals && meal) await at(meal.ts + 20 * MIN, 'Time for an after-meal sit', 'A sit about 20 minutes after eating often catches a wee or poo.', 'potty');
    // Daily reminders for the next 3 days, so they keep coming even if the app isn't opened for a while.
    // Times are built from the calendar (atHour/addDays), so they stay right across daylight-saving changes.
    for (let k = 0; k < 3; k++) {
      const day = addDays(today, k);
      if (S.rem.bed) await at(atHour(day, S.bedtime) - 15 * MIN, 'Bedtime wee soon', 'One wee before bath and one right before sleep.');
      // evening check-in (today only if there are logs and it isn't done yet)
      if (S.rem.evening && (k > 0 || (!S.checkins[day] && onDay(day, isPotty).length)))
        await at(atHour(day, 18.5), 'How did today go?', "20-second check-in. It sets up tomorrow's plan.", 'evening', { day });
      // next morning's plan
      if (S.rem.morning) await at(atHour(addDays(day, 1), Math.max(7, S.quietEnd + 0.5)), 'Good morning!', `Today: ${item().t}. Tap "Woke up now" to start the timer.`, 'morning');
    }
  } catch { /* scheduling is best effort */ } finally {
    busy = false;
    if (again) { again = false; reschedule(); }
  }
}

export async function previewReminder() {
  if (!(await permission(true))) { toast('Notifications are off', 'Turn them on in your phone settings'); return; }
  const nm = S.child.name || 'Your child';
  await Notifications.scheduleNotificationAsync({
    content: { title: `${nm} may need to go soon`, body: 'This is a preview. Try the buttons: they log straight away.', categoryIdentifier: 'potty' } as any,
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 } as any,
  });
  toast('Reminder in 5 seconds', 'Lock your phone to see it like a real one');
}

export { Notifications };
