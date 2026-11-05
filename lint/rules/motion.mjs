import { walkDeclarations } from '../context.mjs';

export const ANIMATABLE = new Set([
	'transform',
	'translate',
	'scale',
	'rotate',
	'opacity',
	'color',
	'background-color',
	'background',
	'border-color',
	'outline-color',
	'text-decoration-color',
	'fill',
	'stroke',
	'box-shadow',
	'filter',
	'backdrop-filter',
	'visibility',
	'display',
	'overlay',
	'none'
]);

const TIMING = /^(ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end|steps|cubic-bezier|var|allow-discrete|normal)$|^-?\d*\.?\d+m?s$|^-?\d*\.?\d+$/;

function splitTopLevel(value) {
	const parts = [];
	let depth = 0;
	let current = '';
	for (const ch of value) {
		if (ch === '(') depth++;
		if (ch === ')') depth--;
		if (ch === ',' && depth === 0) {
			parts.push(current);
			current = '';
		} else current += ch;
	}
	parts.push(current);
	return parts.map((p) => p.trim()).filter(Boolean);
}

export function transitionedProperties(value) {
	const out = [];
	for (const item of splitTopLevel(value)) {
		for (const word of item.split(/\s+/)) {
			const name = word.replace(/\(.*$/, '');
			if (TIMING.test(name) || word.startsWith('var(')) continue;
			out.push(word.toLowerCase());
			break;
		}
	}
	return out;
}

export default {
	id: 'motion',
	description: 'transition/animation on properties other than transform/opacity/color/background-color/box-shadow/filter',
	check(ctx) {
		walkDeclarations(ctx, (d, { atrules }) => {
			if (d.property === 'transition' || d.property === 'transition-property') {
				for (const prop of transitionedProperties(d.value)) {
					if (ANIMATABLE.has(prop) || prop.startsWith('--')) continue;
					ctx.report(
						'motion',
						d.start,
						prop === 'all'
							? 'transition: all animates layout; list transform/opacity/color/background-color/box-shadow/filter explicitly'
							: `transition on "${prop}" animates layout; animate only transform/opacity/color/background-color/box-shadow/filter`
					);
				}
			}
			if (atrules.some((a) => a.name === 'keyframes') && !ANIMATABLE.has(d.property) && !/^(--|animation-)/.test(d.property)) {
				ctx.report(
					'motion',
					d.start,
					`keyframe animates "${d.property}"; animate only transform/opacity/color/background-color/box-shadow/filter`
				);
			}
		});
	}
};
