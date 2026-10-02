/** @param {string} h */
const hexRgb = (h) => [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16) / 255);
/** @param {number} c */
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
/** @param {number} c */
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** @param {string} hex */
export const luminance = (hex) => {
	const [r, g, b] = hexRgb(hex).map(toLin);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG 2 contrast ratio. @param {string} a @param {string} b */
export const contrast = (a, b) => {
	const [x, y] = [luminance(a), luminance(b)];
	return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/**
 * @param {string} hex
 * @returns {[number, number, number]} OKLCH [L, C, H°]
 */
export const oklch = (hex) => {
	const [r, g, b] = hexRgb(hex).map(toLin);
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
	const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
	const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
	return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
};

/** @param {number} L @param {number} C @param {number} H */
const oklchLin = (L, C, H) => {
	const a = C * Math.cos((H * Math.PI) / 180);
	const b = C * Math.sin((H * Math.PI) / 180);
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
	];
};

/** OKLCH → sRGB hex, shedding chroma until the colour fits the gamut. @param {number} L @param {number} C @param {number} H */
export const fromOklch = (L, C, H) => {
	/** @param {number} c */
	const fits = (c) => oklchLin(L, c, H).every((v) => v >= -1e-6 && v <= 1 + 1e-6);
	let lo = 0;
	let hi = C;
	if (!fits(C)) {
		for (let i = 0; i < 30; i++) {
			const mid = (lo + hi) / 2;
			if (fits(mid)) lo = mid;
			else hi = mid;
		}
		C = lo;
	}
	return `#${oklchLin(L, C, H)
		.map((v) => Math.round(toGamma(Math.min(1, Math.max(0, v))) * 255).toString(16).padStart(2, '0'))
		.join('')}`;
};

/** Backgrounds text and controls sit on. */
export const SURFACES = ['bg', 'bg-elev', 'surface'];

/** Minimum contrast against every SURFACES entry (WCAG 1.4.3 text, 1.4.11 control boundaries). */
export const FLOORS = {
	text: 7,
	'text-muted': 5.5,
	'text-faint': 4.5,
	accent: 4.5,
	blue: 4.5,
	amber: 4.5,
	red: 4.5,
	green: 4.5,
	violet: 4.5,
	gold: 4.5,
	teal: 4.5,
	'border-strong': 3
};

/** Ink drawn on a filled accent (primary buttons, selected rows). */
export const INK_FLOOR = 4.5;

/** @typedef {Record<string, string>} Palette `--c-*` hex values, prefix stripped, plus `md-code-bg`. */

/** `color-mix(in srgb, <blue> w, <bg>)`. @param {string} blue @param {string} bg @param {number} w */
export const mixBlue = (blue, bg, w) =>
	`#${[1, 3, 5]
		.map((i) => {
			const [f, b] = [blue, bg].map((h) => Number.parseInt(h.slice(i, i + 2), 16));
			return Math.round(f * w + b * (1 - w)).toString(16).padStart(2, '0');
		})
		.join('')}`;

/**
 * Palette per theme id; `dark` is tokens.css :root. `md-code-bg` is resolved from the block's
 * blue/bg mix (default 14%), and `codeMix` holds that weight per theme.
 * @param {string} tokensCss @param {string} themesCss
 */
export const palettes = (tokensCss, themesCss) => {
	/** @param {string} body */
	const pick = (body) =>
		Object.fromEntries([...body.matchAll(/--c-([a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2].toLowerCase()]));
	/** @param {string} body */
	const weight = (body) => Number(body.match(/--md-code-bg: color-mix\(in srgb, var\(--c-blue\) (\d+)%/)?.[1] ?? 14) / 100;
	/** @type {Record<string, string>} */
	const bodies = { dark: tokensCss.match(/^:root {([^}]*)}/m)?.[1] ?? '' };
	for (const m of themesCss.matchAll(/^\[data-theme="([a-z]+)"\] {([^}]*)}/gm)) bodies[m[1]] = m[2];
	/** @type {Record<string, Palette>} */
	const out = {};
	/** @type {Record<string, number>} */
	const codeMix = {};
	for (const [id, body] of Object.entries(bodies)) {
		const p = pick(body);
		codeMix[id] = weight(body);
		out[id] = { ...p, 'md-code-bg': mixBlue(p.blue, p.bg, codeMix[id]) };
	}
	return { palettes: out, codeMix };
};

/** Every contrast-floor breach in one palette, as `token/surface=ratio<floor` strings. @param {Palette} p */
export const breaches = (p) => {
	const out = [];
	for (const [tok, floor] of Object.entries(FLOORS))
		for (const s of SURFACES) {
			const r = contrast(p[tok], p[s]);
			if (r < floor) out.push(`${tok}/${s}=${r.toFixed(2)}<${floor}`);
		}
	const code = contrast(p.blue, p['md-code-bg']);
	if (code < FLOORS.blue) out.push(`blue/md-code-bg=${code.toFixed(2)}<${FLOORS.blue}`);
	const ink = contrast(p['accent-ink'], p.accent);
	if (ink < INK_FLOOR) out.push(`accent-ink/accent=${ink.toFixed(2)}<${INK_FLOOR}`);
	return out;
};
