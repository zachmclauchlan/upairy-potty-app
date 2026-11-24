// Web preview: no system notifications. Reminders are a phone feature.
import { toast } from '@/components/ui';
export const supported = false;
export async function initNotifications() {}
export async function permission(_ask: boolean) { return false; }
export function handleResponse(_r: any) {}
export async function reschedule() {}
export async function previewReminder() { toast('Reminders work on the phone app', 'Open it in Expo Go to try them'); }
export const Notifications = null as any;
