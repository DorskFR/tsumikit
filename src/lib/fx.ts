// `data-fx-<family>="<variant>"` on <html> or any ancestor picks a family's
// effect; without the attribute the first variant applies.

export const FX = {
	hover: {
		label: 'Button hover',
		variants: [
			{ id: 'smoke', label: 'Smoke' },
			{ id: 'ember', label: 'Ember' },
			{ id: 'aurora', label: 'Aurora' },
			{ id: 'none', label: 'Off' },
		],
	},
	check: {
		label: 'Checkbox',
		variants: [
			{ id: 'draw', label: 'Draw' },
			{ id: 'pop', label: 'Pop' },
			{ id: 'confetti', label: 'Confetti' },
			{ id: 'morph', label: 'Morph' },
			{ id: 'none', label: 'Off' },
		],
	},
	radio: {
		label: 'Radio',
		variants: [
			{ id: 'spring', label: 'Spring' },
			{ id: 'liquid', label: 'Liquid' },
			{ id: 'none', label: 'Off' },
		],
	},
	switch: {
		label: 'Switch',
		variants: [
			{ id: 'squash', label: 'Squash' },
			{ id: 'glow', label: 'Glow' },
			{ id: 'calm', label: 'Calm' },
			{ id: 'none', label: 'Off' },
		],
	},
	focus: {
		label: 'Input focus',
		variants: [
			{ id: 'bloom', label: 'Bloom' },
			{ id: 'label', label: 'Spring label' },
			{ id: 'none', label: 'Off' },
		],
	},
	tabs: {
		label: 'Tabs',
		variants: [
			{ id: 'pill', label: 'Pill' },
			{ id: 'stretch', label: 'Stretch' },
			{ id: 'ink', label: 'Ink' },
			{ id: 'none', label: 'Off' },
		],
	},
	copy: {
		label: 'Copy',
		variants: [
			{ id: 'burst', label: 'Burst' },
			{ id: 'tick', label: 'Tick' },
			{ id: 'none', label: 'Off' },
		],
	},
	link: {
		label: 'Link hover',
		variants: [
			{ id: 'sweep', label: 'Sweep' },
			{ id: 'highlight', label: 'Highlight' },
			{ id: 'none', label: 'Off' },
		],
	},
	card: {
		label: 'Card hover',
		variants: [
			{ id: 'spotlight', label: 'Spotlight' },
			{ id: 'orbit', label: 'Orbit' },
			{ id: 'none', label: 'Off' },
		],
	},
} as const satisfies Record<
	string,
	{ label: string; variants: readonly { id: string; label: string }[] }
>;

export type FxFamily = keyof typeof FX;
export type FxVariant<F extends FxFamily = FxFamily> = (typeof FX)[F]['variants'][number]['id'];
export type FxSettings = { [F in FxFamily]: FxVariant<F> };

export const FX_FAMILIES = Object.keys(FX) as FxFamily[];

export const DEFAULT_FX = Object.fromEntries(
	FX_FAMILIES.map((f) => [f, FX[f].variants[0].id]),
) as FxSettings;

export function fxAttr(family: FxFamily): `data-fx-${FxFamily}` {
	return `data-fx-${family}`;
}

export function isFxVariant<F extends FxFamily>(family: F, v: unknown): v is FxVariant<F> {
	return FX[family].variants.some((x) => x.id === v);
}

/** Settings from an untrusted blob: unknown families are dropped, unknown
 *  variants fall back to `defaults`. */
export function parseFx(raw: unknown, defaults: FxSettings = DEFAULT_FX): FxSettings {
	const blob = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
	const out = { ...defaults } as Record<FxFamily, string>;
	for (const f of FX_FAMILIES) if (isFxVariant(f, blob[f])) out[f] = blob[f] as string;
	return out as FxSettings;
}

export function fxDiff(settings: FxSettings): Partial<FxSettings> {
	const out: Partial<Record<FxFamily, string>> = {};
	for (const f of FX_FAMILIES) if (settings[f] !== DEFAULT_FX[f]) out[f] = settings[f];
	return out as Partial<FxSettings>;
}

/** Inline <head> script painting the persisted `data-fx-*` before first paint. */
export function fxPrepaint(key: string): string {
	const valid = Object.fromEntries(
		FX_FAMILIES.map((f) => [f, FX[f].variants.slice(1).map((v) => v.id)]),
	);
	return `(function(){try{var s=localStorage.getItem(${JSON.stringify(key)});if(!s)return;var b=JSON.parse(s),v=${JSON.stringify(valid)},d=document.documentElement;if(!b||typeof b!=='object')return;for(var f in v)if(v[f].indexOf(b[f])>=0)d.setAttribute('data-fx-'+f,b[f])}catch(e){}})();`;
}
