import type { ComponentMeta } from '../../framework/registry';

export const meta: ComponentMeta = {
	description:
		'Every component publishes --<prefix>-<axis> custom properties (bg, fg, border, size, radius) you set from style or an ancestor rule instead of reaching in with :global().',
	keywords: [
		'css custom properties',
		'override',
		'restyle',
		'hooks',
		'btn-bg',
		'badge-fs',
		'no global',
	],
	seeAlso: ['ThemeTokens', 'Theming', 'Button', 'Badge'],
	order: 5,
};
