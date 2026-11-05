import { inlineDeclarations, walkDeclarations, walkMarkup } from '../context.mjs';

const THEME_SELECTOR = /:root|:host|\[data-theme|\[data-look|@theme/;
const HEX = /#[0-9a-f]{3,8}\b/i;
const FUNCTIONS = /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(([^()]*(?:\([^()]*\)[^()]*)*)\)/gi;

function stripUrls(value) {
	return value.replace(/url\((?:[^)(]|\([^)(]*\))*\)/gi, 'url()');
}

export function rawColorIn(value) {
	const text = stripUrls(value);
	if (HEX.test(text)) return HEX.exec(text)[0];
	for (const m of text.matchAll(FUNCTIONS)) {
		if (!/var\(|\bfrom\b/.test(m[2])) return m[0];
	}
	return null;
}

function check(ctx, declaration, selectors, atrules) {
	if (declaration.property.startsWith('--')) return;
	if (selectors.some((s) => THEME_SELECTOR.test(s))) return;
	if (atrules.some((a) => a.name === 'property')) return;
	const hit = rawColorIn(declaration.value);
	if (hit) {
		ctx.report(
			'no-raw-color',
			declaration.start,
			`raw color ${hit} in "${declaration.property}"; use a theme token (var(--…)) or define it in a theme block`
		);
	}
}

export default {
	id: 'no-raw-color',
	description: 'hex/rgb/hsl literals outside a theme block',
	check(ctx) {
		walkDeclarations(ctx, (d, { selectors, atrules }) => check(ctx, d, selectors, atrules));
		walkMarkup(ctx, (node) => {
			if (node.type !== 'RegularElement' && node.type !== 'Component') return;
			for (const d of inlineDeclarations(node)) check(ctx, d, [], []);
		});
	}
};
