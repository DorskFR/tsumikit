import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createContext } from './context.mjs';
import breakpoints from './rules/breakpoints.mjs';
import imgAlt from './rules/img-alt.mjs';
import motion from './rules/motion.mjs';
import noRawColor from './rules/no-raw-color.mjs';
import noRawControl from './rules/no-raw-control.mjs';
import noRawFont from './rules/no-raw-font.mjs';
import onePrimary from './rules/one-primary.mjs';
import spacingScale from './rules/spacing-scale.mjs';

/**
 * @typedef {import('./context.mjs').Finding} Finding
 * @typedef {import('./context.mjs').LintRule} LintRule
 */

export { BREAKPOINTS, isAllowedBreakpointWidth } from './breakpoints.mjs';

/** @type {LintRule[]} */
export const RULES = [
	noRawColor,
	spacingScale,
	noRawControl,
	onePrimary,
	noRawFont,
	breakpoints,
	motion,
	imgAlt
];

export const RULE_IDS = RULES.map((r) => r.id);

const SKIP_DIRS = new Set(['node_modules', '.svelte-kit', 'dist', 'build', '.git', 'coverage']);

/** @param {{ only?: string[], disable?: string[] }} [options] */
export function selectRules({ only = [], disable = [] } = {}) {
	const unknown = [...only, ...disable].filter((id) => !RULE_IDS.includes(id));
	if (unknown.length) throw new Error(`unknown rule(s): ${unknown.join(', ')}`);
	return RULES.filter((r) => (only.length ? only.includes(r.id) : true) && !disable.includes(r.id));
}

/**
 * Lints one source string; returns `{ findings, error }`.
 * @param {string} file
 * @param {string} source
 * @param {LintRule[]} [rules]
 */
export function lintSource(file, source, rules = RULES) {
	let ctx;
	try {
		ctx = createContext(file, source);
	} catch (err) {
		const e = /** @type {import('svelte/compiler').CompileError} */ (err);
		return {
			findings: [{ file, line: e.start?.line ?? 1, column: e.start?.column ?? 1, rule: 'parse-error', message: e.message }],
			error: e
		};
	}
	for (const rule of rules) rule.check(ctx);
	ctx.findings.sort((a, b) => a.line - b.line || a.column - b.column);
	return { findings: ctx.findings, error: null };
}

/** @param {string[]} paths */
export async function collectFiles(paths) {
	/** @type {string[]} */
	const files = [];
	/** @param {string} path */
	const visit = async (path) => {
		const info = await stat(path);
		if (info.isDirectory()) {
			for (const entry of await readdir(path, { withFileTypes: true })) {
				if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
				await visit(join(path, entry.name));
			}
		} else if (/\.(svelte|css)$/i.test(path)) files.push(path);
	};
	for (const p of paths) await visit(p);
	return files.sort();
}

/**
 * @param {string[]} paths
 * @param {{ rules?: LintRule[], cwd?: string }} [options]
 */
export async function lintPaths(paths, { rules = RULES, cwd = process.cwd() } = {}) {
	const files = await collectFiles(paths);
	/** @type {Finding[]} */
	const findings = [];
	for (const file of files) {
		const source = await readFile(file, 'utf8');
		const result = lintSource(relative(cwd, file) || file, source, rules);
		findings.push(...result.findings);
	}
	return { files: files.length, findings };
}
