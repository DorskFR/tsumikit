import type { ComponentMeta } from '../../framework/registry';

export const meta: ComponentMeta = {
	description:
		'The shared breakpoint list (sm 40rem, md 48rem, lg 64rem) used by every kit @media rule, exported as breakpoints / mq for JS, and enforced by tsumikit-lint; reach for container queries inside panes.',
	keywords: [
		'breakpoint',
		'media query',
		'responsive',
		'matchMedia',
		'mq',
		'viewport',
		'rem',
		'lint',
	],
	seeAlso: ['AppShell', 'Modal', 'Container', 'ThemeTokens'],
	order: 6,
};
