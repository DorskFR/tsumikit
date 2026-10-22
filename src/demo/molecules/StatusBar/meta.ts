import type { ComponentMeta } from '../../framework/registry';

export const meta: ComponentMeta = {
	description:
		'A thin live-status row for a panel: a tone dot (a spinner while busy), a label or custom content, and a trailing slot for timers and counters.',
	keywords: ['status', 'activity', 'busy', 'typing', 'connection', 'footer', 'live', 'indicator'],
	seeAlso: ['ConversationPanel', 'Dot', 'Spinner', 'Callout'],
};
