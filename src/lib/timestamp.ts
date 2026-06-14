// Pure date-formatting helpers behind <Timestamp> — the logic lives here (and
// stays unit-testable / framework-free) while the component owns only the
// display-mode switching and the popover. Everything accepts the same loose
// `TimeInput` (Date | epoch ms | ISO string) and tolerates bad input by
// returning '' rather than throwing, so a single malformed value never takes
// down a table row.

export type TimeInput = Date | number | string;

/** How the timestamp text renders inline. */
export type TimestampMode = 'iso' | 'local' | 'time' | 'relative';

/** Coerce a loose input to a Date, or null when it can't be parsed. */
export function toDate(value: TimeInput): Date | null {
	const d = value instanceof Date ? value : new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}

/** Full ISO 8601, UTC — `2026-06-14T07:30:00.000Z`. */
export function toISO(d: Date): string {
	return d.toISOString();
}

/** Locale date+time in the viewer's zone — `6/14/2026, 4:30:00 PM`. */
export function toLocal(d: Date): string {
	return d.toLocaleString();
}

/** Clock only, zero-padded `HH:MM:SS`, in the viewer's local zone. */
export function toClock(d: Date): string {
	const p = (n: number) => String(n).padStart(2, '0');
	return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** Unix epoch in whole seconds. */
export function toEpochSeconds(d: Date): number {
	return Math.floor(d.getTime() / 1000);
}

/** The viewer's IANA time zone — `Asia/Tokyo`, `UTC`, … */
export function localTimeZone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * "3m ago", "2h ago", "5d ago" — past-relative, coarsening as it ages and
 * falling back to a locale date once past ~30 days. Future instants read
 * "in 3m" etc. `now` is injectable so callers (and tests) control the clock.
 */
export function relativeTime(value: TimeInput, now: number = Date.now()): string {
	const d = toDate(value);
	if (!d) return '';
	const deltaMs = now - d.getTime();
	const future = deltaMs < 0;
	const secs = Math.floor(Math.abs(deltaMs) / 1000);
	const suffix = (s: string) => (future ? `in ${s}` : `${s} ago`);

	if (secs < 60) return suffix(`${secs}s`);
	const mins = Math.floor(secs / 60);
	if (mins < 60) return suffix(`${mins}m`);
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return suffix(`${hrs}h`);
	const days = Math.floor(hrs / 24);
	if (days < 30) return suffix(`${days}d`);
	return d.toLocaleDateString();
}

/** Render a date in the chosen inline mode. Returns '' for unparseable input. */
export function formatTimestamp(value: TimeInput, mode: TimestampMode, now?: number): string {
	const d = toDate(value);
	if (!d) return '';
	switch (mode) {
		case 'iso':
			return toISO(d);
		case 'local':
			return toLocal(d);
		case 'time':
			return toClock(d);
		case 'relative':
			return relativeTime(d, now);
	}
}
