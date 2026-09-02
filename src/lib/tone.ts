export type Tone = 'neutral' | 'ok' | 'success' | 'warn' | 'danger' | 'info' | 'accent';

export function canonicalTone(t: string): string {
	return t === 'success' ? 'ok' : t;
}
