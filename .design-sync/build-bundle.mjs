/**
 * Build the claude.ai/design bundle from the real Svelte components.
 *
 * The design runtime renders React off a window global. @dorsk/kakehashi wraps
 * each Svelte export as a React component, so the bundle ships the ACTUAL
 * compiled components and their real scoped CSS — no hand-written mirrors.
 *
 *   node .design-sync/build-bundle.mjs
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { compileModule } from 'svelte/compiler';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'ds-bundle');
const GLOBAL = 'Tsumikit_a4c6ce';

const GROUPS = { atoms: 'Atoms', molecules: 'Molecules', layouts: 'Layouts', organisms: 'Organisms' };

/* ---------- 1. discover the public component API ---------- */

const indexTs = readFileSync(join(ROOT, 'src/lib/index.ts'), 'utf8');
// Match the whole `export { … } from './…svelte'` block — many exports span
// several lines and carry types alongside the default, so a single-line pattern
// silently misses them.
const components = [...indexTs.matchAll(/export\s*\{([\s\S]*?)\}\s*from\s*['"](\.[^'"]+\.svelte)['"]/g)]
	.flatMap(([, block, rel]) => {
		const m = block.match(/default as (\w+)/);
		if (!m) return [];
		const src = rel.replace(/^\.\//, 'src/lib/');
		return [{ name: m[1], src, group: GROUPS[src.split('/')[3]] ?? 'Components' }];
	});
if (!components.length) throw new Error('no components found in src/lib/index.ts');
console.log(`[build] ${components.length} components`);

/* ---------- 2. bundle: kakehashi-wrapped Svelte -> window.<GLOBAL> ---------- */

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, '_vendor'), { recursive: true });

const entry = [
	`import { toReact } from '@dorsk/kakehashi';`,
	`export { snippet } from '@dorsk/kakehashi';`,
	...components.map((c, i) => `import C${i} from '${join(ROOT, c.src)}';`),
	...components.map((c, i) => `export const ${c.name} = toReact(C${i}, '${c.name}');`),
].join('\n');

// react/react-dom come from the vendored UMD globals the cards load first.
const externalGlobals = {
	name: 'external-globals',
	setup(b) {
		b.onResolve({ filter: /^(react|react-dom)$/ }, (a) => ({ path: a.path, namespace: 'globals' }));
		b.onLoad({ filter: /.*/, namespace: 'globals' }, (a) => ({
			contents:
				a.path === 'react'
					? 'module.exports = window.React;'
					: 'module.exports = window.ReactDOM;',
			loader: 'js',
		}));
	},
};

// `.svelte.js` runes modules need compileModule — esbuild-svelte only does `.svelte`.
const runesModules = {
	name: 'svelte-runes-module',
	setup(b) {
		b.onLoad({ filter: /\.svelte\.js$/ }, (a) => ({
			contents: compileModule(readFileSync(a.path, 'utf8'), { filename: a.path, generate: 'client' }).js.code,
			loader: 'js',
		}));
	},
};

// Strip TS. verbatimModuleSyntax keeps imports that are only used in the
// TEMPLATE — without it esbuild drops them and components vanish at runtime.
const tsPreprocess = {
	script: async ({ content, attributes }) =>
		attributes.lang !== 'ts'
			? { code: content }
			: { code: (await esbuild.transform(content, { loader: 'ts', tsconfigRaw: { compilerOptions: { verbatimModuleSyntax: true } } })).code },
};

await esbuild.build({
	stdin: { contents: entry, resolveDir: ROOT, loader: 'js' },
	bundle: true,
	format: 'iife',
	globalName: GLOBAL,
	// A bare `var` only lands on window under a real <script> tag, and esbuild's
	// dotted globalName emits `var window;` which shadows the real one. Assign in
	// the footer instead: same scope as the var, correct under any loader.
	footer: { js: `window.${GLOBAL} = ${GLOBAL};` },
	outfile: join(OUT, '_ds_bundle.js'),
	jsx: 'automatic',
	conditions: ['svelte', 'browser'],
	// $lib/... is a SvelteKit alias esbuild does not know.
	alias: { $lib: join(ROOT, 'src/lib') },
	define: { 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true', 'import.meta.env': '{}' },
	plugins: [externalGlobals, runesModules, sveltePlugin({ preprocess: [tsPreprocess], compilerOptions: { css: 'external' } })],
	logLevel: 'warning',
});

// esbuild names the css after the outfile
const cssOut = join(OUT, '_ds_bundle.css');
if (!existsSync(cssOut)) throw new Error('no _ds_bundle.css emitted — component styles would be missing');

/* ---------- 3. styling layer (the repo's real dist/styles) ---------- */

const STYLES = ['app', 'reset', 'syntax', 'themes', 'tokens', 'utilities', 'variables'];
mkdirSync(join(OUT, 'tokens'), { recursive: true });
for (const f of STYLES) cpSync(join(ROOT, `dist/styles/${f}.css`), join(OUT, `${f}.css`));
for (const f of ['tokens', 'themes', 'variables']) cpSync(join(ROOT, `dist/styles/${f}.css`), join(OUT, `tokens/${f}.css`));

// Rendered designs receive ONLY the styles.css @import closure — component CSS
// must be reachable from it, not just linked by the cards.
writeFileSync(join(OUT, 'styles.css'), '@import "./_ds_fonts.css";\n@import "./app.css";\n@import "./_ds_bundle.css";\n');

// The design project hosts fonts/JetBrainsMono-Regular.ttf (not in this repo);
// --font-mono names the family, so declare the face it resolves to.
writeFileSync(
	join(OUT, '_ds_fonts.css'),
	'@font-face {\n  font-family: "JetBrains Mono";\n  src: url("./fonts/JetBrainsMono-Regular.ttf") format("truetype");\n  font-weight: 400;\n  font-style: normal;\n  font-display: swap;\n}\n',
);

// Resolves `react` to the window global so the react-dom vendor shares the one
// React instance published by _vendor/react.js.
const reactOnlyGlobal = {
	name: 'react-only-global',
	setup(b) {
		b.onResolve({ filter: /^react$/ }, (a) => ({ path: a.path, namespace: 'globals' }));
		b.onLoad({ filter: /.*/, namespace: 'globals' }, () => ({ contents: 'module.exports = window.React;', loader: 'js' }));
	},
};

// React 19 ships no UMD build, so vendor it as a self-contained IIFE that
// publishes the same globals the cards expect. createRoot lives in
// react-dom/client since 19; fold it back onto the ReactDOM global.
for (const [file, contents] of [
	['react.js', "import * as React from 'react'; window.React = React;"],
	[
		'react-dom.js',
		"import * as ReactDOM from 'react-dom'; import { createRoot, hydrateRoot } from 'react-dom/client'; window.ReactDOM = Object.assign({}, ReactDOM, { createRoot, hydrateRoot });",
	],
]) {
	await esbuild.build({
		stdin: { contents, resolveDir: ROOT, loader: 'js' },
		bundle: true,
		format: 'iife',
		minify: true,
		outfile: join(OUT, '_vendor', file),
		define: { 'process.env.NODE_ENV': '"production"' },
		// react-dom must NOT carry its own React: two copies leave the hooks
		// dispatcher null ("Cannot read properties of null (reading 'useState')").
		plugins: file === 'react-dom.js' ? [reactOnlyGlobal] : [],
		logLevel: 'warning',
	});
}

/* ---------- 4. per-component files ---------- */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Pull the props type literal that annotates $props(). */
function extractProps(source) {
	const named = source.match(/type \w*Props\s*=\s*[^{]*\{([\s\S]*?)\n\t\};/);
	if (named) return named[1];
	const inline = source.match(/\}:\s*\{([\s\S]*?)\n\t\}\s*=\s*\$props\(\)/);
	if (inline) return inline[1];
	return null;
}

/** Prop names with a usable literal/boolean default, for a card that renders. */
function propSummary(body) {
	if (!body) return [];
	return [...body.matchAll(/^\s*(?:\/\/.*\n\s*)*(\w+)(\??):\s*([^;]+);/gm)].map(([, name, opt, type]) => ({
		name,
		optional: opt === '?',
		type: type.replace(/\s+/g, ' ').trim(),
	}));
}

const CARD_DEFAULTS = JSON.parse(readFileSync(join(ROOT, '.design-sync/card-props.json'), 'utf8'));

for (const c of components) {
	const dir = join(OUT, 'components', c.group, c.name);
	mkdirSync(dir, { recursive: true });
	const source = readFileSync(join(ROOT, c.src), 'utf8');
	const body = extractProps(source);
	const props = propSummary(body);

	// .jsx — one-line re-export into window scope (the bundle owns the impl)
	writeFileSync(join(dir, `${c.name}.jsx`), `export const ${c.name} = window.${GLOBAL}.${c.name};\nexport default ${c.name};\n`);

	// .d.ts — the real prop contract, straight from the component source
	const dts = body
		? `export interface ${c.name}Props {${body.replace(/\t/g, '  ')}\n}\n\ndeclare const ${c.name}: (props: ${c.name}Props) => JSX.Element;\nexport default ${c.name};\n`
		: `export interface ${c.name}Props { [key: string]: unknown }\n\ndeclare const ${c.name}: (props: ${c.name}Props) => JSX.Element;\nexport default ${c.name};\n`;
	writeFileSync(join(dir, `${c.name}.d.ts`), dts);

	// .prompt.md — usage reference for the design agent
	const rows = props.length
		? props.map((p) => `| \`${p.name}\` | \`${p.type}\` | ${p.optional ? '' : 'required'} |`).join('\n')
		: '| — | — | — |';
	const snippetProps = props.filter((p) => /\bSnippet\b/.test(p.type));
	const snippetNote = snippetProps.length
		? `\n## Snippet props\n\n${snippetProps.map((p) => `\`${p.name}\``).join(', ')} ${snippetProps.length > 1 ? 'are' : 'is a'} Svelte snippet${snippetProps.length > 1 ? 's' : ''}. Pass a React element, or wrap a function in \`snippet()\` to receive the render arguments:\n\n\`\`\`jsx\nconst { ${c.name}, snippet } = window.${GLOBAL};\n<${c.name} ${snippetProps.map((p) => `${p.name}={snippet((...args) => <div>…</div>)}`).join(' ')} />\n\`\`\`\n`
		: '';
	writeFileSync(
		join(dir, `${c.name}.prompt.md`),
		`---\ncategory: ${c.group}\n---\n\n# ${c.name}\n\nA real Svelte component from \`@dorsk/tsumikit\`, exposed to React via a bridge.\nStyling comes from the kit's own scoped CSS — do not restyle it; compose around it\nwith the design tokens and utility classes documented in the README.\n\n\`\`\`jsx\nconst { ${c.name} } = window.${GLOBAL};\n\`\`\`\n\n## Props\n\n| Prop | Type | |\n|---|---|---|\n${rows}\n\nChildren are passed through as the component's default snippet. Props are passed to the Svelte component verbatim: use \`onclick\` / \`class\`, not React's \`onClick\` / \`className\`.\n${snippetNote}`,
	);

	// .html — preview card. `variants` renders a labelled row per entry;
	// `propsExpr` is raw JS for props JSON cannot express (callbacks, snippets).
	const cfg = CARD_DEFAULTS[c.name] ?? {};
	const variants = (cfg.variants ?? [cfg]).map((v) => ({
		label: v.label ?? null,
		props: v.propsExpr ?? JSON.stringify(v.props ?? cfg.props ?? {}),
		children: JSON.stringify(v.children === undefined ? (cfg.children === undefined ? c.name : cfg.children) : v.children),
	}));
	const renders = variants
		.map((v) => `h('div', { className: 'variant' }, ${variants.length > 1 ? `h('span', { className: 'label faint' }, ${JSON.stringify(v.label ?? '')}), ` : ''}h(C, ${v.props}, ${v.children}))`)
		.join(',\n      ');
	writeFileSync(
		join(dir, `${c.name}.html`),
		`<!-- @dsCard group="${esc(c.group)}" viewport="520x220" name="${esc(c.name)}" subtitle="${esc(cfg.subtitle ?? `${c.group.replace(/s$/, '')} · @dorsk/tsumikit`)}" -->
<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.name)} — tsumikit</title>
<link rel="stylesheet" href="../../../styles.css">
<style>body{margin:0;padding:var(--sp-6);background:var(--bg);color:var(--text);font-family:var(--font-sans)}#root{display:flex;flex-direction:column;gap:var(--sp-3)}.variant{display:flex;align-items:center;gap:var(--sp-3)}.label{font-size:var(--fs-xs);min-width:5rem}</style>
</head><body>
<div id="root"></div>
<script src="../../../_vendor/react.js"></script>
<script src="../../../_vendor/react-dom.js"></script>
<script src="../../../_ds_bundle.js"></script>
<script>
  var h = React.createElement;
  var C = window.${GLOBAL}[${JSON.stringify(c.name)}];
  var root = document.getElementById('root');
  try {
    ReactDOM.createRoot(root).render(h(React.Fragment, null,
      ${renders}
    ));
  } catch (e) {
    root.textContent = '\\u26A0 ' + (e && e.message || e);
  }
</script>
</body></html>
`,
	);
}

/* ---------- 5. README + bundle header ---------- */

const header = readFileSync(join(ROOT, '.design-sync/conventions.md'), 'utf8');
writeFileSync(join(OUT, 'README.md'), header);

const bundlePath = join(OUT, '_ds_bundle.js');
const sourceHashes = Object.fromEntries(
	components.flatMap((c) => {
		const base = `components/${c.group}/${c.name}/${c.name}`;
		return ['.jsx', '.d.ts', '.prompt.md']
			.map((ext) => base + ext)
			.filter((rel) => existsSync(join(OUT, rel)))
			.map((rel) => [rel, createHash('sha256').update(readFileSync(join(OUT, rel))).digest('hex').slice(0, 12)]);
	}),
);
const meta = {
	namespace: GLOBAL,
	components: components.map((c) => ({ name: c.name, sourcePath: `components/${c.group}/${c.name}/${c.name}.jsx` })),
	sourceHashes,
	inlinedExternals: [],
	builtBy: 'tsumikit/.design-sync/build-bundle.mjs',
};
writeFileSync(
	bundlePath,
	`/* @ds-bundle: ${JSON.stringify(meta).replace(/\*\//g, '*\\/')} */\n` + readFileSync(bundlePath, 'utf8'),
);

console.log(`[build] bundle ${(readFileSync(bundlePath).length / 1024).toFixed(0)}kB  css ${(readFileSync(cssOut).length / 1024).toFixed(0)}kB`);
console.log(`[build] out: ${OUT}`);
