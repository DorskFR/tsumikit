import type { ComponentMeta } from '../../framework/registry';

export const meta: ComponentMeta = {
	description:
		'One notification row: tone icon, title, two-line text, relative time, unread dot, up to two actions plus a "…" menu, inline confirm and a pending state; resolved items turn muted with their state label.',
	keywords: [
		'notification',
		'inbox',
		'alert',
		'approval',
		'approve',
		'reject',
		'unread',
		'activity',
		'feed item',
	],
	seeAlso: ['NotificationCenter', 'Callout', 'Toaster'],
};
