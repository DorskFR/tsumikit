import { parse } from 'svelte/compiler';

const IGNORE_RE = /tsumikit-lint-ignore(?:\s+([\w-]+(?:[\s,]+[\w-]+)*))?/g;

function lineStarts(source) {
	const starts = [0];
	for (let i = 0; i < source.length; i++) {
		if (source.charCodeAt(i) === 10) starts.push(i + 1);
	}
	return starts;
}

function positionOf(starts, offset) {
	let lo = 0;
	let hi = starts.length - 1;
	while (lo < hi) {
		const mid = (lo + hi + 1) >> 1;
		if (starts[mid] <= offset) lo = mid;
		else hi = mid - 1;
	}
	return { line: lo + 1, column: offset - starts[lo] + 1 };
}

/**
 * Collects `tsumikit-lint-ignore [rule ...]` comments. A comment suppresses the
 * named rules (all rules when none is given) on the following line, and on its
 * own line when code precedes it.
 */
function collectIgnores(source, starts) {
	const ignores = new Map();
	const add = (line, rules) => {
		const existing = ignores.get(line);
		if (existing === 'all') return;
		if (rules === 'all') ignores.set(line, 'all');
		else ignores.set(line, new Set([...(existing ?? []), ...rules]));
	};
	for (const m of source.matchAll(IGNORE_RE)) {
		const { line } = positionOf(starts, m.index);
		const rules = m[1] ? m[1].split(/[\s,]+/).filter(Boolean) : 'all';
		const lineText = source.slice(starts[line - 1], m.index);
		if (/\S/.test(lineText.replace(/(\/\*|<!--|\/\/)\s*$/, ''))) add(line, rules);
		add(line + 1, rules);
	}
	return ignores;
}

/**
 * Parses a .svelte or .css source into a lint context. CSS is wrapped in a
 * <style> element so the Svelte CSS parser can be reused; offsets are shifted
 * back when reporting.
 */
export function createContext(file, source) {
	const isCss = /\.css$/i.test(file);
	const shift = isCss ? '<style>'.length : 0;
	const parsed = parse(isCss ? `<style>${source}</style>` : source, { modern: true });
	const starts = lineStarts(source);
	const ignores = collectIgnores(source, starts);
	const findings = [];
	const parseSource = isCss ? `<style>${source}</style>` : source;

	return {
		file,
		source,
		isCss,
		css: parsed.css,
		fragment: isCss ? null : parsed.fragment,
		text(node) {
			return parseSource.slice(node.start, node.end);
		},
		loc(offset) {
			return positionOf(starts, Math.max(0, offset - shift));
		},
		report(rule, offset, message) {
			const { line, column } = this.loc(offset);
			const ignored = ignores.get(line);
			if (ignored === 'all' || ignored?.has(rule)) return;
			findings.push({ file, line, column, rule, message });
		},
		findings
	};
}

/**
 * Visits every CSS declaration with its enclosing selectors and at-rules.
 * `cb(declaration, { selectors, atrules })` where `selectors` are the selector
 * texts of enclosing rules (outermost first) and `atrules` the enclosing
 * at-rule nodes.
 */
export function walkDeclarations(ctx, cb) {
	if (!ctx.css) return;
	const visit = (nodes, selectors, atrules) => {
		for (const node of nodes) {
			if (node.type === 'Declaration') cb(node, { selectors, atrules });
			else if (node.type === 'Rule') {
				visit(node.block.children, [...selectors, ctx.text(node.prelude)], atrules);
			} else if (node.type === 'Atrule' && node.block) {
				visit(node.block.children, selectors, [...atrules, node]);
			}
		}
	};
	visit(ctx.css.children, [], []);
}

export function walkAtrules(ctx, cb) {
	if (!ctx.css) return;
	const visit = (nodes) => {
		for (const node of nodes) {
			if (node.type === 'Atrule') {
				cb(node);
				if (node.block) visit(node.block.children);
			} else if (node.type === 'Rule') visit(node.block.children);
		}
	};
	visit(ctx.css.children);
}

const CHILD_KEYS = ['fragment', 'consequent', 'alternate', 'body', 'fallback', 'pending', 'then', 'catch'];

/** Visits every markup node (elements, components, blocks) depth-first. */
export function walkMarkup(ctx, cb) {
	if (!ctx.fragment) return;
	const visit = (node) => {
		if (!node || typeof node !== 'object') return;
		if (node.type === 'Fragment') {
			for (const child of node.nodes) visit(child);
			return;
		}
		cb(node);
		for (const key of CHILD_KEYS) {
			if (node[key]) visit(node[key]);
		}
	};
	visit(ctx.fragment);
}

/** Static text of an attribute, or null when it is dynamic or absent. */
export function staticAttribute(node, name) {
	const attr = node.attributes?.find((a) => a.type === 'Attribute' && a.name === name);
	if (!attr) return null;
	if (attr.value === true) return '';
	const values = Array.isArray(attr.value) ? attr.value : [attr.value];
	if (values.some((v) => v.type !== 'Text')) return null;
	return values.map((v) => v.data).join('');
}

export function hasAttribute(node, name) {
	return node.attributes?.some((a) => a.type === 'Attribute' && a.name === name) ?? false;
}

export function hasSpread(node) {
	return node.attributes?.some((a) => a.type === 'SpreadAttribute') ?? false;
}

/**
 * Declarations written inline on an element (`style="…"` and `style:prop`
 * directives) with static values, as `{ property, value, start }`.
 */
export function inlineDeclarations(node) {
	const out = [];
	for (const attr of node.attributes ?? []) {
		if (attr.type === 'Attribute' && attr.name === 'style') {
			const text = staticAttributeText(attr);
			if (text == null) continue;
			for (const chunk of text.split(';')) {
				const i = chunk.indexOf(':');
				if (i < 0) continue;
				out.push({
					property: chunk.slice(0, i).trim(),
					value: chunk.slice(i + 1).trim(),
					start: attr.start
				});
			}
		} else if (attr.type === 'StyleDirective') {
			const values = Array.isArray(attr.value) ? attr.value : [attr.value];
			if (attr.value === true || values.some((v) => v.type !== 'Text')) continue;
			out.push({ property: attr.name, value: values.map((v) => v.data).join(''), start: attr.start });
		}
	}
	return out;
}

function staticAttributeText(attr) {
	if (attr.value === true) return '';
	const values = Array.isArray(attr.value) ? attr.value : [attr.value];
	if (values.some((v) => v.type !== 'Text')) return null;
	return values.map((v) => v.data).join('');
}
