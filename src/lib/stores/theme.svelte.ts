import { browser } from '$lib/env';

// Theme registry. Built-ins live in THEMES (+ one [data-theme="id"] block in
// styles/themes.css); consumers append their own with theme.register() and ship
// the matching block in their own stylesheet. `themeColor` drives the mobile
// browser-chrome <meta theme-color>; `mode` groups the theme into the picker's
// light/dark sections.
const KEY = 'tsumikit-theme';

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
	readonly fallbackIcon = FALLBACK_ICON;
	private registered = $state<ThemeDef[]>([]);
	private fallback: ThemeId = 'dark';
	private saved: string | null = null;

	constructor() {
		if (browser) {
			this.saved = localStorage.getItem(KEY);
			this.resolve();
		}
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
		this.current = this.has(this.saved) ? this.saved : this.fallback;
		this.apply();
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
		this.saved = mode;
		this.current = mode;
		if (browser) localStorage.setItem(KEY, mode);
		this.apply();
	}
}

export const theme = new Theme();
