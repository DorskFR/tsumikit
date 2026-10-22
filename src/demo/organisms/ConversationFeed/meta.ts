import type { ComponentMeta } from '../../framework/registry';

export const meta: ComponentMeta = {
	description:
		'A scrolling message log that sticks to the bottom while you are there, keeps the viewport still when older items are prepended and offers a jump-to-latest pill.',
	keywords: [
		'chat',
		'feed',
		'log',
		'messages',
		'scroll',
		'stick to bottom',
		'infinite',
		'load older',
		'timeline',
	],
	seeAlso: ['ConversationPanel', 'ChatBubble', 'LoadMore'],
};
