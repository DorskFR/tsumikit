import { browser } from '$app/environment';

// OPT-IN. Most apps don't need this: the kit is rem-based and never resets the
// root font-size, so the user's browser/OS font-size preference and browser
// zoom already scale the UI correctly. Reach for this control only in
// reading-dense apps (chat, docs, readers) that want to enlarge BODY TEXT while
// keeping chrome compact — not wired into AppShell or any default.
//
// Global UI font scale. The control multiplies ONLY the font-size tokens
// (--fs-scale, consumed by every --fs-* in variables.css) — NOT the document
// root font-size. Scaling the root would grow every rem-based chrome dimension
// (control heights, padding) in lockstep, so text would barely grow relative to
// a ballooning UI. Driving --fs-scale leaves spacing/control sizes fixed and
// enlarges only text. Discrete levels avoid per-pixel reflow churn.
const KEY = 'uikit-font-scale';

export interface ScaleLevel {
	id: string;
	label: string;
	value: number;
}
export const SCALE_LEVELS: ScaleLevel[] = [
	{ id: 'smallest', label: 'Smallest', value: 0.8 },
	{ id: 'small', label: 'Small', value: 0.9 },
	{ id: 'normal', label: 'Normal', value: 1 },
	{ id: 'large', label: 'Large', value: 1.2 },
	{ id: 'largest', label: 'Largest', value: 1.5 }
];
const DEFAULT_LEVEL = 'normal';

function levelById(id: string): ScaleLevel {
	return SCALE_LEVELS.find((l) => l.id === id) ?? SCALE_LEVELS[2];
}

class FontScale {
	levelId = $state<string>(DEFAULT_LEVEL);
	current = $derived(levelById(this.levelId).value);

	constructor() {
		if (browser) {
			const raw = localStorage.getItem(KEY);
			if (raw && SCALE_LEVELS.some((l) => l.id === raw)) this.levelId = raw;
			this.apply();
		}
	}
	private apply() {
		if (!browser) return;
		document.documentElement.style.setProperty('--fs-scale', String(levelById(this.levelId).value));
	}
	set(id: string) {
		this.levelId = SCALE_LEVELS.some((l) => l.id === id) ? id : DEFAULT_LEVEL;
		if (browser) localStorage.setItem(KEY, this.levelId);
		this.apply();
	}
}

export const fontScale = new FontScale();
