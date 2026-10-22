import type { IconName } from '@dorsk/tsumikit';

export type NavGroup = {
	label?: string;
	items: { id: string; label: string; icon: IconName; badge?: number; tone?: 'warn' | 'danger' }[];
};

export const groups: NavGroup[] = [
	{
		items: [
			{ id: 'overview', label: 'Overview', icon: 'home' },
			{ id: 'activity', label: 'Activity', icon: 'live', badge: 38 },
		],
	},
	{
		label: 'Library',
		items: [
			{ id: 'files', label: 'Files', icon: 'folder', badge: 12 },
			{ id: 'starred', label: 'Starred', icon: 'star', badge: 4, tone: 'warn' },
			{ id: 'shared', label: 'Shared with me', icon: 'users' },
		],
	},
	{
		label: 'System',
		items: [
			{ id: 'alerts', label: 'Alerts', icon: 'bell', badge: 2, tone: 'danger' },
			{ id: 'settings', label: 'Settings', icon: 'settings' },
		],
	},
];
