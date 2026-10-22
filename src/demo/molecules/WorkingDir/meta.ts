import type { ComponentMeta } from '../../framework/registry';

export const meta: ComponentMeta = {
	description:
		'Path chip that abbreviates fish-style as its width shrinks (ancestors to initials, then the leaf alone, then an ellipsis), with the full path in the tooltip.',
	keywords: [
		'cwd',
		'path',
		'directory',
		'folder',
		'fish',
		'abbreviate',
		'terminal',
		'shell',
		'copy path',
	],
	seeAlso: ['Truncate', 'GitRef', 'Breadcrumb', 'ResizablePanel'],
};
