import { staticAttribute } from '../context.mjs';

/**
 * @typedef {import('../context.mjs').Fragment} Fragment
 * @typedef {import('../context.mjs').MarkupNode} MarkupNode
 * @typedef {import('../context.mjs').ElementLike} ElementLike
 */

/**
 * Returns the primaries that can render at the same time inside `node`.
 * Exclusive branches (if/else, await states) contribute the largest branch;
 * snippets are separate scopes checked on their own.
 * @param {MarkupNode | Fragment | null | undefined} node
 * @param {Fragment[]} scopes
 * @returns {ElementLike[]}
 */
function primaries(node, scopes) {
	if (!node || typeof node !== 'object') return [];
	switch (node.type) {
		case 'Fragment':
			return node.nodes.flatMap((n) => primaries(n, scopes));
		case 'IfBlock':
			return largest(primaries(node.consequent, scopes), primaries(node.alternate, scopes));
		case 'AwaitBlock':
			return largest(
				primaries(node.pending, scopes),
				primaries(node.then, scopes),
				primaries(node.catch, scopes)
			);
		case 'EachBlock':
			return largest(primaries(node.body, scopes), primaries(node.fallback, scopes));
		case 'KeyBlock':
			return primaries(node.fragment, scopes);
		case 'SnippetBlock':
			scopes.push(node.body);
			return [];
		case 'Component':
		case 'RegularElement':
		case 'SvelteElement':
		case 'SvelteBoundary':
		case 'SvelteComponent':
		case 'SvelteSelf': {
			const own =
				node.type === 'Component' && staticAttribute(node, 'variant') === 'primary' ? [node] : [];
			return [...own, ...primaries(node.fragment, scopes)];
		}
		default:
			return [];
	}
}

/** @template T @param {T[][]} lists */
function largest(...lists) {
	return lists.reduce((a, b) => (b.length > a.length ? b : a), /** @type {T[]} */ ([]));
}

export default /** @type {import('../context.mjs').LintRule} */ ({
	id: 'one-primary',
	description: 'more than one variant="primary" rendered in the same branch',
	check(ctx) {
		if (!ctx.fragment) return;
		const scopes = [ctx.fragment];
		while (scopes.length) {
			const found = primaries(scopes.shift(), scopes);
			for (const node of found.slice(1)) {
				ctx.report(
					'one-primary',
					node.start,
					`${found.length} primary actions render together (first at line ${ctx.loc(found[0].start).line}); keep one primary per view`
				);
			}
		}
	}
});
