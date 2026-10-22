import { browser } from '$lib/env';
import {
	DEFAULT_FX,
	FX_FAMILIES,
	type FxFamily,
	type FxSettings,
	type FxVariant,
	fxAttr,
	fxDiff,
	fxPrepaint,
	isFxVariant,
	parseFx,
} from '$lib/fx';
import { readStorage, writeStorage } from './storage';

// Until something is saved or set, <html> is left untouched so attributes an
// app wrote itself win.
const KEY = 'tsumikit-fx';

export const FX_PREPAINT = fxPrepaint(KEY);

class Fx {
	settings = $state<FxSettings>({ ...DEFAULT_FX });
	onchange?: (settings: FxSettings) => void;

	constructor() {
		if (!browser) return;
		const raw = readStorage(KEY);
		if (!raw) return;
		try {
			this.settings = parseFx(JSON.parse(raw));
		} catch {}
		this.apply();
	}

	get<F extends FxFamily>(family: F): FxVariant<F> {
		return this.settings[family];
	}

	set<F extends FxFamily>(family: F, variant: string) {
		if (!isFxVariant(family, variant)) return;
		this.settings = { ...this.settings, [family]: variant };
		this.commit();
	}

	reset() {
		this.settings = { ...DEFAULT_FX };
		this.commit();
	}

	get isDefault(): boolean {
		return Object.keys(fxDiff(this.settings)).length === 0;
	}

	/** Replay settings an app persisted itself, without echoing through `onchange`. */
	hydrate(settings: Partial<FxSettings>) {
		this.settings = parseFx(settings);
		this.apply();
		if (browser) writeStorage(KEY, JSON.stringify(fxDiff(this.settings)));
	}

	private commit() {
		this.apply();
		if (browser) writeStorage(KEY, JSON.stringify(fxDiff(this.settings)));
		this.onchange?.(this.settings);
	}

	private apply() {
		if (!browser) return;
		const root = document.documentElement;
		for (const f of FX_FAMILIES) {
			if (this.settings[f] === DEFAULT_FX[f]) root.removeAttribute(fxAttr(f));
			else root.setAttribute(fxAttr(f), this.settings[f]);
		}
	}
}

export const fx = new Fx();
