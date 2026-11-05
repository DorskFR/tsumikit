import { inlineDeclarations, walkDeclarations, walkMarkup } from '../context.mjs';

/**
 * @typedef {import('../context.mjs').Context} Context
 * @typedef {import('../context.mjs').DeclarationLike} DeclarationLike
 */

const TOKEN_ONLY = /^(?:var\(--font-[\w-]+\)|inherit|initial|unset|revert)\s*(?:,\s*(?:var\(--font-[\w-]+\)|[a-z-]+))*$/i;
const MONO = /var\(--font-mono\)/;
const CODE_WORDS = new Set([
	'code', 'pre', 'kbd', 'samp', 'tt', 'mono', 'monospace', 'term', 'terminal', 'console', 'shell',
	'cmd', 'command', 'prompt', 'log', 'logs', 'diff', 'json', 'yaml', 'toml', 'hash', 'sha', 'digest',
	'path', 'snippet', 'editor', 'trace', 'stack', 'output', 'stdout', 'stderr', 'hex', 'uuid', 'ansi'
]);

/** @param {string[]} selectors */
export function isCodeIsh(selectors) {
	return selectors.some((s) =>
		s
			.replace(/([a-z])([A-Z])/g, '$1 $2')
			.toLowerCase()
			.split(/[^a-z0-9]+/)
			.some((w) => CODE_WORDS.has(w))
	);
}

/**
 * @param {Context} ctx
 * @param {DeclarationLike} declaration
 * @param {string[]} selectors
 */
function check(ctx, declaration, selectors) {
	if (declaration.property !== 'font-family') return;
	if (selectors.some((s) => /:root|:host|\[data-theme|\[data-look/.test(s))) return;
	const value = declaration.value.trim();
	if (!TOKEN_ONLY.test(value)) {
		ctx.report(
			'no-raw-font',
			declaration.start,
			`raw font-family "${value}"; use var(--font-sans) / var(--font-mono) / var(--font-numeric) / var(--font-label)`
		);
		return;
	}
	if (MONO.test(value) && !isCodeIsh(selectors)) {
		ctx.report(
			'no-raw-font',
			declaration.start,
			`--font-mono on a non-code element (${selectors.at(-1) ?? 'inline style'}); use var(--font-numeric) for values or var(--font-label) for labels, or add tsumikit-lint-ignore if it really is code`
		);
	}
}

export default /** @type {import('../context.mjs').LintRule} */ ({
	id: 'no-raw-font',
	description: 'font-family other than the --font-* tokens; --font-mono only on code-ish elements',
	check(ctx) {
		walkDeclarations(ctx, (d, { selectors }) => check(ctx, d, selectors));
		walkMarkup(ctx, (node) => {
			if (node.type !== 'RegularElement' && node.type !== 'Component') return;
			const selectors = node.type === 'RegularElement' ? [node.name] : [];
			for (const d of inlineDeclarations(node)) check(ctx, d, selectors);
		});
	}
});
