import { browser } from '$lib/env';
import {
	AUTO_THEME,
	chooseTheme,
	DEFAULT_THEME_PREFERENCE,
	preferenceFrom,
	resolveTheme,
	type SlotOf,
	type ThemeChoice,
	type ThemePreference,
} from '$lib/theme-mode';

// Theme registry. Built-ins live in THEMES (+ one [data-theme="id"] block in
// styles/themes.css); consumers append their own with theme.register() and ship
// the matching block in their own stylesheet. `themeColor` drives the mobile
// browser-chrome <meta theme-color>; `mode` groups the theme into the picker's
// light/dark sections.
//
// `tsumikit-theme` holds a {mode,light,dark} blob; a bare theme id there is a
// legacy value and migrates through `preferenceFrom`.
const KEY = 'tsumikit-theme';
const SCHEME_QUERY = '(prefers-color-scheme: dark)';

export const THEMES = [
	// ── Light ── bright, paper-white surfaces
	{ id: 'light', label: 'Light', icon: '☀', themeColor: '#f6f7f9', mode: 'light' },
	{
		id: 'highcontrast',
		label: 'High Contrast Light',
		icon: '◻',
		themeColor: '#ffffff',
		mode: 'light',
	},
	// ── Medium-light (TSU-1) ── easy on the eyes, not blinding, distinct bases
	{ id: 'gruvboxlight', label: 'Gruvbox Light', icon: '◇', themeColor: '#fbf1c7', mode: 'light' },
	{
		id: 'solarizedlight',
		label: 'Solarized Light',
		icon: '◑',
		themeColor: '#fdf6e3',
		mode: 'light',
	},
	{
		id: 'everforestlight',
		label: 'Everforest Light',
		icon: '✾',
		themeColor: '#fdf6e3',
		mode: 'light',
	},
	{ id: 'rosepinedawn', label: 'Rosé Pine Dawn', icon: '✿', themeColor: '#faf4ed', mode: 'light' },
	{ id: 'latte', label: 'Catppuccin Latte', icon: 'L', themeColor: '#eff1f5', mode: 'light' },
	{ id: 'nordlight', label: 'Nord Light', icon: 'n', themeColor: '#eceff4', mode: 'light' },
	{ id: 'tokyoday', label: 'Tokyo Night Day', icon: '✧', themeColor: '#e1e2e7', mode: 'light' },
	{ id: 'kanagawalotus', label: 'Kanagawa Lotus', icon: '❁', themeColor: '#f2ecbc', mode: 'light' },
	{ id: 'sepia', label: 'Sepia', icon: '✶', themeColor: '#f4ecd8', mode: 'light' },
	// ── Dark ──
	{ id: 'dark', label: 'Dark', icon: '☾', themeColor: '#0f1115', mode: 'dark' },
	{ id: 'colorblind', label: 'Color-blind safe', icon: '◐', themeColor: '#16181d', mode: 'dark' },
	{ id: 'mocha', label: 'Catppuccin Mocha', icon: 'M', themeColor: '#1e1e2e', mode: 'dark' },
	{ id: 'dracula', label: 'Dracula', icon: 'D', themeColor: '#282a36', mode: 'dark' },
	{ id: 'nord', label: 'Nord', icon: 'N', themeColor: '#2e3440', mode: 'dark' },
	{ id: 'tokyonight', label: 'Tokyo Night', icon: '✦', themeColor: '#1a1b26', mode: 'dark' },
	{ id: 'gruvbox', label: 'Gruvbox', icon: '◆', themeColor: '#282828', mode: 'dark' },
	{ id: 'solarized', label: 'Solarized Dark', icon: '◒', themeColor: '#002b36', mode: 'dark' },
	{ id: 'rosepine', label: 'Rosé Pine', icon: '❀', themeColor: '#191724', mode: 'dark' },
	{ id: 'onedark', label: 'One Dark', icon: '①', themeColor: '#282c34', mode: 'dark' },
	{ id: 'everforest', label: 'Everforest', icon: '☘', themeColor: '#2d353b', mode: 'dark' },
	{ id: 'monokai', label: 'Monokai', icon: '✸', themeColor: '#272822', mode: 'dark' },
	{ id: 'amoled', label: 'AMOLED (high contrast)', icon: '◼', themeColor: '#000000', mode: 'dark' },
] as const;

export type Mode = (typeof THEMES)[number]['id'];
export type ThemeMode = (typeof THEMES)[number]['mode'];
export type ThemeId = Mode | (string & {});
export interface ThemeDef {
	id: ThemeId;
	label: string;
	mode: ThemeMode;
	icon?: string;
	themeColor?: string;
}

const FALLBACK_ICON = '◈';

class Theme {
	current = $state<ThemeId>('dark');
	/** True while the system asks for a dark scheme; only read in `auto`. */
	systemDark = $state(false);
	pref = $state<ThemePreference>(DEFAULT_THEME_PREFERENCE);
	/** Called with the new preference whenever the user changes it, so an app
	 *  can mirror it into its own (server-side) settings. */
	onchange?: (pref: ThemePreference) => void;
	readonly fallbackIcon = FALLBACK_ICON;
	private registered = $state<ThemeDef[]>([]);
	private fallback: ThemeId = 'dark';
	private saved: string | null = null;

	constructor() {
		if (browser) {
			const mq = typeof matchMedia === 'function' ? matchMedia(SCHEME_QUERY) : null;
			this.systemDark = mq?.matches ?? false;
			mq?.addEventListener?.('change', (e) => {
				this.systemDark = e.matches;
				this.paint();
			});
			this.saved = localStorage.getItem(KEY);
			this.resolve();
		}
	}
	get slotOf(): SlotOf {
		return (id) => this.all.find((t) => t.id === id)?.mode ?? null;
	}
	/** `auto`, or the pinned slot. */
	get mode(): ThemeChoice {
		return this.pref.mode;
	}
	/** The theme id painted for the current preference. */
	get resolved(): ThemeId {
		return resolveTheme(this.pref, this.systemDark);
	}
	/** What a picker shows as selected: `auto`, or the pinned slot's theme id. */
	get choice(): string {
		return this.pref.mode === AUTO_THEME ? AUTO_THEME : this.resolved;
	}
	get all(): readonly ThemeDef[] {
		const byId = new Map<string, ThemeDef>();
		for (const t of THEMES) byId.set(t.id, t);
		for (const t of this.registered) byId.set(t.id, t);
		return [...byId.values()];
	}
	has(id: string | null | undefined): id is ThemeId {
		return id != null && this.all.some((t) => t.id === id);
	}
	register(defs: ThemeDef | ThemeDef[]) {
		const list = Array.isArray(defs) ? defs : [defs];
		this.registered = [...this.registered.filter((r) => !list.some((d) => d.id === r.id)), ...list];
		this.resolve();
	}
	setDefault(id: ThemeId) {
		this.fallback = id;
		this.resolve();
	}
	private resolve() {
		this.pref = this.read();
		this.paint();
	}
	private read(): ThemePreference {
		const seed = chooseTheme(DEFAULT_THEME_PREFERENCE, this.fallback, this.slotOf);
		if (!this.saved) return seed;
		let blob: Partial<ThemePreference> | null = null;
		try {
			const parsed: unknown = JSON.parse(this.saved);
			if (parsed && typeof parsed === 'object') blob = parsed as Partial<ThemePreference>;
		} catch {}
		return preferenceFrom(
			blob
				? { themeMode: blob.mode, lightTheme: blob.light, darkTheme: blob.dark }
				: { theme: this.saved },
			this.slotOf,
			seed,
		);
	}
	private paint() {
		this.current = this.resolved;
		this.apply();
	}
	private persist() {
		this.saved = JSON.stringify(this.pref);
		if (browser) {
			try {
				localStorage.setItem(KEY, this.saved);
			} catch {}
		}
		this.onchange?.(this.pref);
	}
	private apply() {
		if (!browser) return;
		document.documentElement.setAttribute('data-theme', this.current);
		const color = this.option.themeColor;
		if (color)
			document
				.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
				?.setAttribute('content', color);
	}
	get option(): ThemeDef {
		return this.all.find((t) => t.id === this.current) ?? this.all[0];
	}
	get label(): string {
		return this.option.label;
	}
	get icon(): string {
		return this.option.icon ?? FALLBACK_ICON;
	}
	get next(): ThemeDef {
		const all = this.all;
		const i = all.findIndex((t) => t.id === this.current);
		return all[(i + 1) % all.length];
	}
	toggle() {
		this.set(this.next.id);
	}
	set(mode: ThemeId) {
		this.choose(mode);
	}
	/** A picker choice: `auto`, or a theme id, which also becomes its slot's
	 *  remembered theme. An unregistered id is ignored. */
	choose(choice: string): ThemePreference {
		this.pref = chooseTheme(this.pref, choice, this.slotOf);
		this.paint();
		this.persist();
		return this.pref;
	}
	/** Replay a preference an app persisted itself, without echoing it back
	 *  through `onchange`. */
	hydrate(pref: ThemePreference) {
		this.pref = pref;
		this.saved = JSON.stringify(pref);
		this.paint();
	}
}

export const theme = new Theme();
