import { inlineDeclarations, walkDeclarations, walkMarkup } from '../context.mjs';

/**
 * @typedef {import('../context.mjs').Context} Context
 * @typedef {import('../context.mjs').DeclarationLike} DeclarationLike
 */

const PROPERTY = /^(padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left|scroll-padding|scroll-margin)(-|$)/;
const LENGTH = /(?<![\w.-])(-?\d*\.?\d+)(px|rem)(?![\w%])/g;

/** @type {ReadonlyArray<readonly [string, number]>} */
export const SPACING_SCALE = [
	['--sp-0-5', 0.125],
	['--sp-1', 0.25],
	['--sp-1-5', 0.375],
	['--sp-2', 0.5],
	['--sp-3', 0.75],
	['--sp-4', 1],
	['--sp-5', 1.25],
	['--sp-6', 1.5],
	['--sp-8', 2],
	['--sp-10', 2.5],
	['--sp-12', 3]
];

/** @param {string} value */
function stripFunctions(value) {
	return value.replace(/\b(var|env|url)\((?:[^)(]|\([^)(]*\))*\)/gi, ' ');
}

/** @param {number} amount @param {string} unit */
export function tokenFor(amount, unit) {
	const rem = unit === 'px' ? amount / 16 : amount;
	const match = SPACING_SCALE.find(([, v]) => Math.abs(v - Math.abs(rem)) < 1e-6);
	if (!match) return null;
	return rem < 0 ? `calc(-1 * var(${match[0]}))` : `var(${match[0]})`;
}

/** @param {Context} ctx @param {DeclarationLike} declaration */
function check(ctx, declaration) {
	if (!PROPERTY.test(declaration.property)) return;
	for (const m of stripFunctions(declaration.value).matchAll(LENGTH)) {
		const amount = Number(m[1]);
		const unit = m[2];
		if (amount === 0 || (unit === 'px' && Math.abs(amount) === 1)) continue;
		const token = tokenFor(amount, unit);
		const hint = token ? `use ${token}` : 'not on the --sp-* scale';
		ctx.report(
			'spacing-scale',
			declaration.start,
			`raw ${m[0]} in "${declaration.property}"; ${hint}`
		);
	}
}

export default /** @type {import('../context.mjs').LintRule} */ ({
	id: 'spacing-scale',
	description: 'px/rem in padding/margin/gap/inset that is not a --sp-* token (1px allowed)',
	check(ctx) {
		walkDeclarations(ctx, (d) => check(ctx, d));
		walkMarkup(ctx, (node) => {
			if (node.type !== 'RegularElement' && node.type !== 'Component') return;
			for (const d of inlineDeclarations(node)) check(ctx, d);
		});
	}
});
