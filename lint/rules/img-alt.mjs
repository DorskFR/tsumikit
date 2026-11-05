import { hasAttribute, hasSpread, walkMarkup } from '../context.mjs';

export default /** @type {import('../context.mjs').LintRule} */ ({
	id: 'img-alt',
	description: '<img> without alt',
	check(ctx) {
		walkMarkup(ctx, (node) => {
			if (node.type !== 'RegularElement' || node.name !== 'img') return;
			if (hasAttribute(node, 'alt') || hasSpread(node)) return;
			ctx.report('img-alt', node.start, '<img> without alt; add alt text, or alt="" when decorative');
		});
	}
});
