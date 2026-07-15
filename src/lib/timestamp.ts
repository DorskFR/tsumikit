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

const MIN = 60;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/**
 * "3m ago", "2h ago", "5d ago" — past-relative, coarsening as it ages and
 * falling back to a locale date once past ~30 days. Future instants read
 * "in 3m" etc. `now` is injectable so callers (and tests) control the clock.
 *
 * The single-unit form **rounds to the nearest** unit (not truncating), so an
 * instant 1d 15h away reads "in 2d" rather than the misleading "in 1d", and the
 * rounding carries across boundaries (23h40m → "1d"). Pass `precision` for the
 * two-unit form — "1d 15h", "1h 55m" — which keeps the coarse unit exact and
 * shows the remainder instead of rounding it away.
 */
export function relativeTime(
	value: TimeInput | null | undefined,
	now: number = Date.now(),
	precision = false,
): string {
	const d = toDate(value);
	if (!d) return '';
	const deltaMs = now - d.getTime();
	const future = deltaMs < 0;
	const secs = Math.floor(Math.abs(deltaMs) / 1000);
	const suffix = (s: string) => (future ? `in ${s}` : `${s} ago`);

	if (secs < MIN) return suffix(`${secs}s`);
	if (secs >= 30 * DAY) return d.toLocaleDateString();

	if (precision) {
		if (secs < HOUR) {
			const m = Math.floor(secs / MIN);
			const s = secs % MIN;
			return suffix(s ? `${m}m ${s}s` : `${m}m`);
		}
		if (secs < DAY) {
			const h = Math.floor(secs / HOUR);
			const m = Math.floor((secs % HOUR) / MIN);
			return suffix(m ? `${h}h ${m}m` : `${h}h`);
		}
		const days = Math.floor(secs / DAY);
		const h = Math.floor((secs % DAY) / HOUR);
		return suffix(h ? `${days}d ${h}h` : `${days}d`);
	}

	const mins = Math.round(secs / MIN);
	if (mins < 60) return suffix(`${mins}m`);
	const hrs = Math.round(secs / HOUR);
	if (hrs < 24) return suffix(`${hrs}h`);
	const days = Math.round(secs / DAY);
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
	precision = false,
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
			return relativeTime(d, now, precision);
	}
}
