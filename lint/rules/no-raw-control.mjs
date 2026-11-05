import { staticAttribute, walkMarkup } from '../context.mjs';

/** @type {Partial<Record<string, string>>} */
const CONTROLS = {
	button: 'Button',
	input: 'Input / Checkbox / Switch / Radio',
	select: 'Select',
	textarea: 'Textarea'
};

export default /** @type {import('../context.mjs').LintRule} */ ({
	id: 'no-raw-control',
	description: 'raw <button>/<input>/<select>/<textarea> instead of the atoms',
	check(ctx) {
		walkMarkup(ctx, (node) => {
			if (node.type !== 'RegularElement') return;
			const atom = CONTROLS[node.name];
			if (!atom) return;
			if (node.name === 'input' && staticAttribute(node, 'type') === 'hidden') return;
			ctx.report('no-raw-control', node.start, `raw <${node.name}>; use the ${atom} atom`);
		});
	}
});
