import type { ComponentMeta } from '../../framework/registry';

export const meta: ComponentMeta = {
	description:
		'One conversation line: a role-tinted bubble with a timestamped meta row, markdown body, footer stats, copy and actions, delivery state and clamp-and-expand.',
	keywords: [
		'chat',
		'message',
		'bubble',
		'assistant',
		'user',
		'markdown',
		'retry',
		'clamp',
		'copy',
	],
	seeAlso: ['ConversationFeed', 'Prose', 'Composer', 'CopyButton'],
};
