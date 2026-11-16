export type NotificationFilter = 'all' | 'unread' | 'action';

/** Day bucket label: "Today", "Yesterday", else a weekday date (with the year when it differs). */
export function dayLabel(time: Date | number | string, now: Date = new Date()): string {
	const d = new Date(time);
	const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
	const days = Math.round((start(now) - start(d)) / 86_400_000);
	if (days === 0) return 'Today';
	if (days === 1) return 'Yesterday';
	return d.toLocaleDateString(undefined, {
		weekday: 'long',
		month: 'short',
		day: 'numeric',
		year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
	});
}
