/** Seconds as `m:ss`, or `h:mm:ss` once the value (or `ref`) reaches an hour. */
export function formatMediaTime(seconds: number, ref = seconds): string {
	if (!Number.isFinite(seconds)) return '--:--';
	const neg = seconds < 0;
	const total = Math.floor(Math.abs(seconds));
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	const pad = (n: number) => String(n).padStart(2, '0');
	const hours = h > 0 || (Number.isFinite(ref) && Math.abs(ref) >= 3600);
	const body = hours ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
	return neg ? `-${body}` : body;
}

/** True when a duration cannot be scrubbed: unknown, live, or empty. */
export function isLiveDuration(duration: number | null | undefined): boolean {
	return duration == null || !Number.isFinite(duration) || duration <= 0;
}

/** Spoken position: "1:02 of 23:45", or just the position when live. */
export function describeMediaTime(
	value: number,
	duration: number | null | undefined,
	format: (s: number, ref?: number) => string = formatMediaTime,
): string {
	if (isLiveDuration(duration)) return format(value);
	const d = duration as number;
	return `${format(value, d)} of ${format(d, d)}`;
}
