// Pure date-formatting helpers behind <Timestamp> — the logic lives here (and
// stays unit-testable / framework-free) while the component owns only the
// display-mode switching and the popover. Everything accepts the same loose
// `TimeInput` (Date | epoch ms | ISO string) and tolerates bad input by
// returning '' rather than throwing, so a single malformed value never takes
// down a table row.

export type TimeInput = Date | number | string;

/**
 * Which slice of the instant the inline text shows. Orthogonal to the zone:
 * `date`/`time`/`datetime` honour the `utc` flag, while `iso` is always UTC
 * (by definition) and `relative` is zoneless.
 */
export type TimestampMode = 'date' | 'time' | 'datetime' | 'relative' | 'iso';

/**
 * Coerce a loose input to a Date, or null when it's missing or can't be parsed.
 * Accepting null/undefined lets callers pass an optional field straight through
 * — the empty case lands on the same "no date" path as bad input.
 */
export function toDate(value: TimeInput | null | undefined): Date | null {
	if (value == null) return null;
	const d = value instanceof Date ? value : new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}

/** Full ISO 8601, UTC — `2026-06-14T07:30:00.000Z`. */
export function toISO(d: Date): string {
	return d.toISOString();
}

/**
 * Locale-formatted date and/or time, in the viewer's zone or UTC. The single
 * `Intl`-backed formatter behind the `date`/`time`/`datetime` modes — splitting
 * the slice (what) from the zone (where) so a date-only field can render `utc`
 * without the off-by-one a local midnight-UTC value otherwise shows.
 */
export function toLocale(
	d: Date,
	parts: 'date' | 'time' | 'datetime' = 'datetime',
	utc = false,
): string {
	const opts: Intl.DateTimeFormatOptions = {};
	if (utc) opts.timeZone = 'UTC';
	if (parts !== 'time') {
		opts.year = 'numeric';
		opts.month = 'numeric';
		opts.day = 'numeric';
	}
	if (parts !== 'date') {
		opts.hour = '2-digit';
		opts.minute = '2-digit';
		opts.second = '2-digit';
	}
	return new Intl.DateTimeFormat(undefined, opts).format(d);
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
export function relativeTime(
	value: TimeInput | null | undefined,
	now: number = Date.now(),
): string {
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

/**
 * Render a date in the chosen inline mode. `utc` selects UTC over the viewer's
 * zone for the date/time/datetime modes (ignored by `iso`, always UTC, and
 * `relative`, zoneless). Returns '' for unparseable input.
 */
export function formatTimestamp(
	value: TimeInput | null | undefined,
	mode: TimestampMode,
	now?: number,
	utc = false,
): string {
	const d = toDate(value);
	if (!d) return '';
	switch (mode) {
		case 'iso':
			return toISO(d);
		case 'date':
		case 'time':
		case 'datetime':
			return toLocale(d, mode, utc);
		case 'relative':
			return relativeTime(d, now);
	}
}
