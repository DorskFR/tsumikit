export type Tone = 'neutral' | 'ok' | 'success' | 'warn' | 'danger' | 'info' | 'accent';

export function canonicalTone<T extends string>(t: T): Exclude<T, 'success'> | 'ok' {
	return (t === 'success' ? 'ok' : t) as Exclude<T, 'success'> | 'ok';
}
