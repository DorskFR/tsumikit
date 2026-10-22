import type { ComponentMeta } from '../../framework/registry';

export const meta: ComponentMeta = {
	description:
		'Page controls for long lists: page mode (bind:page + pageCount) or offset mode (bind:offset + limit + total), with edges, siblings, a range readout and a compact collapse.',
	keywords: [
		'pager',
		'pages',
		'offset',
		'limit',
		'table',
		'list',
		'navigation',
		'next',
		'previous',
	],
	seeAlso: ['LoadMore', 'DataTable', 'IconButton'],
};
