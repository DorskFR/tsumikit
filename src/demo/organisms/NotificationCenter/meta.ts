import type { ComponentMeta } from '../../framework/registry';

export const meta: ComponentMeta = {
	description:
		'A bell with an unread badge that opens the notification list: a Popover on fine pointers, a bottom Drawer on touch and narrow screens; day groups, mark all read, filters, paging and a footer slot.',
	keywords: [
		'notifications',
		'bell',
		'inbox',
		'unread',
		'badge',
		'activity',
		'alerts',
		'approvals',
		'mark all read',
	],
	seeAlso: ['NotificationItem', 'Popover', 'Drawer', 'FilterChips', 'LoadMore'],
};
