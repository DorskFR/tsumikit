// Pure logic behind the light/dark/auto theme preference: the last light and
// the last dark theme the user picked, plus an `auto` mode that follows the
// system's `prefers-color-scheme`. Rune-free so it unit-tests in isolation.

export type ThemeSlot = 'light' | 'dark';
export type ThemeChoice = ThemeSlot | 'auto';

export interface ThemePreference {
	/** `auto` follows the system; `light` / `dark` pin the matching slot. */
	mode: ThemeChoice;
	/** Last light theme the user picked. */
	light: string;
	/** Last dark theme the user picked. */
	dark: string;
	/** Structural look; absent means the default look. */
	look?: string;
}

/** The picker value that means "follow the system". Never a theme id. */
export const AUTO_THEME = 'auto';

export const DEFAULT_THEME_PREFERENCE: ThemePreference = {
	mode: 'dark',
	light: 'light',
	dark: 'dark',
};

/** Which slot a theme id belongs to; `null` when the id is unknown. */
export type SlotOf = (id: string) => ThemeSlot | null;

/** The theme id to paint for a preference, given the system's current scheme. */
export function resolveTheme(pref: ThemePreference, systemDark: boolean): string {
	const slot: ThemeSlot = pref.mode === 'auto' ? (systemDark ? 'dark' : 'light') : pref.mode;
	return slot === 'dark' ? pref.dark : pref.light;
}

/** Apply a picker choice: `auto` switches mode only; a theme id pins its slot
 *  AND becomes that slot's remembered theme. Unknown ids leave the preference
 *  untouched so a stale blob can never paint an unregistered theme. */
export function chooseTheme(
	pref: ThemePreference,
	choice: string,
	slotOf: SlotOf,
): ThemePreference {
	if (choice === AUTO_THEME) return { ...pref, mode: 'auto' };
	const slot = slotOf(choice);
	if (!slot) return pref;
	return { ...pref, mode: slot, [slot]: choice };
}

/** Rebuild a preference from persisted fields. Older blobs only carried a
 *  single `theme`: it seeds whichever slot it belongs to and pins that mode, so
 *  nothing changes for a user who never touched the new picker. Unknown ids
 *  fall back to `defaults` rather than being trusted. */
export function preferenceFrom(
	raw: {
		theme?: string | null;
		themeMode?: string | null;
		lightTheme?: string | null;
		darkTheme?: string | null;
	},
	slotOf: SlotOf,
	defaults: ThemePreference = DEFAULT_THEME_PREFERENCE,
): ThemePreference {
	const light =
		raw.lightTheme && slotOf(raw.lightTheme) === 'light' ? raw.lightTheme : defaults.light;
	const dark = raw.darkTheme && slotOf(raw.darkTheme) === 'dark' ? raw.darkTheme : defaults.dark;
	const pref: ThemePreference = { mode: defaults.mode, light, dark };
	if (raw.themeMode === 'auto' || raw.themeMode === 'light' || raw.themeMode === 'dark') {
		return { ...pref, mode: raw.themeMode };
	}
	if (raw.theme) return chooseTheme(pref, raw.theme, slotOf);
	return pref;
}

/** The picker's current value: `auto`, or the pinned slot's theme id. */
export function pickerValue(pref: ThemePreference): string {
	return pref.mode === 'auto' ? AUTO_THEME : pref.mode === 'dark' ? pref.dark : pref.light;
}

export type LookStatus = 'stable' | 'experimental';

/** Structural looks, an axis independent of the theme. Each non-default look
 *  ships as `@dorsk/tsumikit/looks/<id>.css`, scoped to `:root[data-look="<id>"]`. */
export const LOOKS = [
	{ id: 'default', label: 'Polished', status: 'stable' },
	{ id: 'depth', label: 'Depth', status: 'stable' },
	{ id: 'tactile', label: 'Tactile', status: 'stable' },
	{ id: 'editorial', label: 'Editorial', status: 'experimental' },
] as const satisfies readonly { id: string; label: string; status: LookStatus }[];

export type LookId = (typeof LOOKS)[number]['id'];

export const DEFAULT_LOOK: LookId = 'default';

export function parseLook(v: unknown): LookId {
	return LOOKS.find((l) => l.id === v)?.id ?? DEFAULT_LOOK;
}

/** Inline script that paints `data-theme`, `data-mode` and `data-look` from the
 *  persisted blob before first paint. `themes` resolves a legacy lone theme id. */
export function themePrepaint(
	key: string,
	themes: readonly { id: string; mode: ThemeSlot }[],
): string {
	const looks = LOOKS.filter((l) => l.id !== DEFAULT_LOOK).map((l) => l.id);
	const modes = Object.fromEntries(themes.map((t) => [t.id, t.mode]));
	return `(function(){try{var d=document.documentElement,s=localStorage.getItem(${JSON.stringify(key)});if(!s)return;var b,t,m;try{b=JSON.parse(s)}catch(e){}if(b&&typeof b==='object'){m=b.mode==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):b.mode==='light'?'light':'dark';t=b[m];if(${JSON.stringify(looks)}.indexOf(b.look)>=0)d.setAttribute('data-look',b.look)}else{var k=${JSON.stringify(modes)};if(!Object.prototype.hasOwnProperty.call(k,s))return;t=s;m=k[s]}if(typeof t==='string'&&t)d.setAttribute('data-theme',t);d.setAttribute('data-mode',m)}catch(e){}})();`;
}
