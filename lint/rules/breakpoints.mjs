import { describeBreakpoints, isAllowedBreakpointWidth } from '../breakpoints.mjs';
import { walkAtrules } from '../context.mjs';

const FEATURE = /\(([^()]*width[^()]*)\)/gi;
const LENGTH = /-?\d*\.?\d+(?:px|rem|em)\b/g;

export default {
	id: 'breakpoints',
	description: `media-query widths outside the kit's breakpoints (${describeBreakpoints()})`,
	check(ctx) {
		walkAtrules(ctx, (node) => {
			if (node.name !== 'media' || !node.prelude) return;
			for (const feature of node.prelude.matchAll(FEATURE)) {
				for (const width of feature[1].match(LENGTH) ?? []) {
					if (isAllowedBreakpointWidth(width)) continue;
					ctx.report(
						'breakpoints',
						node.start,
						`media width ${width} is not a kit breakpoint; use ${describeBreakpoints()} (or the max-width form one unit below)`
					);
				}
			}
		});
	}
};
