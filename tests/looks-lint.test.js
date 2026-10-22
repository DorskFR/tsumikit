import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const DIR = new URL('../src/lib/looks/', import.meta.url);
const files = (await readdir(DIR)).filter((f) => f.endsWith('.css')).sort();
const sources = await Promise.all(files.map((f) => readFile(new URL(f, DIR), 'utf8')));

const NAMED = `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet
brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan
darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred
darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue
dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray
green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen
lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink
lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen
linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue
mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy
oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip
peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown
seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal
thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`.split(/\s+/);
const NAMED_RE = new RegExp(`(?<![\\w-])(${NAMED.join('|')})(?![\\w-])`, 'i');
const HEX_RE = /#[0-9a-f]{3,8}(?![\w-])/i;
const FN_RE = /(?<![\w-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(\s*(?!from\s)/i;

/** @param {string} css */
function parse(css) {
	const src = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
	/** @type {{ selector: string, at: string[], decls: string[], line: number }[]} */
	const rules = [];
	let i = 0;
	const lineOf = (/** @type {number} */ at) => src.slice(0, at).split('\n').length;
	/** @param {string[]} at */
	function block(at) {
		let buf = '';
		while (i < src.length) {
			const ch = src[i];
			if (ch === '"' || ch === "'") {
				const end = src.indexOf(ch, i + 1);
				buf += src.slice(i, end + 1);
				i = end + 1;
				continue;
			}
			if (ch === '{') {
				const head = buf.trim();
				i++;
				if (/^@(media|supports|container|layer|scope|starting-style)\b/.test(head)) block([...at, head]);
				else if (/^@(keyframes|property|font-face|counter-style)\b/.test(head)) {
					const r = { selector: head, at, decls: /** @type {string[]} */ ([]), line: lineOf(i) };
					rules.push(r);
					skip(r.decls);
				} else {
					const r = { selector: head, at, decls: /** @type {string[]} */ ([]), line: lineOf(i) };
					rules.push(r);
					decls(r.decls);
				}
				buf = '';
				continue;
			}
			if (ch === '}') {
				i++;
				return;
			}
			if (ch === ';') buf = '';
			else buf += ch;
			i++;
		}
	}
	/** @param {string[]} out */
	function decls(out) {
		let buf = '';
		while (i < src.length && src[i] !== '}') {
			if (src[i] === '{') throw new Error(`nested rule at line ${lineOf(i)}: use flat selectors`);
			if (src[i] === ';') {
				if (buf.trim()) out.push(buf.trim());
				buf = '';
			} else buf += src[i];
			i++;
		}
		if (buf.trim()) out.push(buf.trim());
		i++;
	}
	/** @param {string[]} out */
	function skip(out) {
		let depth = 1;
		let buf = '';
		while (i < src.length && depth) {
			const ch = src[i++];
			if (ch === '{') {
				depth++;
				buf = '';
			} else if (ch === '}') {
				depth--;
				if (buf.trim()) out.push(buf.trim());
				buf = '';
			} else if (ch === ';') {
				if (buf.trim()) out.push(buf.trim());
				buf = '';
			} else buf += ch;
		}
	}
	block([]);
	return rules;
}

/** @param {string} selector */
function splitSelectors(selector) {
	const out = [];
	let depth = 0;
	let cur = '';
	for (const ch of selector) {
		if (ch === '(' || ch === '[') depth++;
		if (ch === ')' || ch === ']') depth--;
		if (ch === ',' && depth === 0) {
			out.push(cur.trim());
			cur = '';
		} else cur += ch;
	}
	out.push(cur.trim());
	return out;
}

/** @param {string} value */
function literalColor(value) {
	const v = value.replace(/var\(\s*--[\w-]+/g, 'var(');
	return v.match(HEX_RE)?.[0] ?? v.match(FN_RE)?.[0] ?? v.match(NAMED_RE)?.[0] ?? null;
}

test('every look listed in LOOKS ships a stylesheet', async () => {
	const { LOOKS } = await import('../src/lib/theme-mode.ts');
	const shipped = files.map((f) => f.replace(/\.css$/, ''));
	assert.deepEqual(
		LOOKS.filter((l) => l.id !== 'default').map((l) => l.id).sort(),
		shipped,
		'src/lib/looks/<id>.css per non-default look'
	);
});

for (const [n, file] of files.entries()) {
	const name = file.replace(/\.css$/, '');
	const rules = parse(sources[n]);

	test(`${file}: no literal colors`, () => {
		const hits = [];
		for (const r of rules)
			for (const d of r.decls) {
				const i = d.indexOf(':');
				const hit = i < 0 ? null : literalColor(d.slice(i + 1));
				if (hit) hits.push(`line ~${r.line} ${r.selector.slice(0, 60)} { ${d} } → ${hit}`);
			}
		assert.deepEqual(hits, [], 'derive colors from theme tokens (var(--…), color-mix, relative colors)');
	});

	test(`${file}: every rule is scoped under :root[data-look="${name}"]`, () => {
		const scope = new RegExp(`^(?::where\\(|:is\\()?:root\\[data-look=(["'])${name}\\1\\]`);
		const bad = [];
		for (const r of rules) {
			if (r.selector.startsWith('@')) continue;
			for (const sel of splitSelectors(r.selector))
				if (!scope.test(sel)) bad.push(`line ~${r.line}: ${sel}`);
		}
		assert.deepEqual(bad, []);
	});

	test(`${file}: no transition: all`, () => {
		const bad = rules.flatMap((r) =>
			r.decls.filter((d) => /^transition(-property)?\s*:.*(?<![\w-])all(?![\w-])/i.test(d)).map((d) => `line ~${r.line}: ${d}`)
		);
		assert.deepEqual(bad, []);
	});
}

test('the lint catches what it claims to', () => {
	const rules = parse(`
		:root[data-look="x"] { --a: #fff; --b: rgb(0 0 0 / 0.2); --c: white; --d: color-mix(in oklab, var(--accent) 30%, transparent); }
		@media (hover: hover) { :root[data-look="x"] .btn, .card { color: oklch(from var(--accent) l c h / 0.4); } }
		@keyframes x-pulse { from { opacity: 0 } to { opacity: 1 } }
	`);
	const values = rules.flatMap((r) => r.decls.map((d) => literalColor(d.slice(d.indexOf(':') + 1))));
	assert.deepEqual(values, ['#fff', 'rgb(', 'white', null, null, null, null]);
	assert.deepEqual(splitSelectors(rules[1].selector), [':root[data-look="x"] .btn', '.card']);
	assert.deepEqual(rules[1].at, ['@media (hover: hover)']);
	assert.equal(literalColor('var(--c-red)'), null);
	assert.equal(literalColor('0 1px 0 color-mix(in oklab, var(--bg) 60%, black)'), 'black');
});
