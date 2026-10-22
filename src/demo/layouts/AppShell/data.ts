import type { IconName } from '@dorsk/tsumikit';

export type ShellLink = {
	id: string;
	label: string;
	icon: IconName;
	badge?: number;
	tone?: 'warn' | 'danger';
};

export const shellNav: { label?: string; items: ShellLink[] }[] = [
	{
		items: [
			{ id: 'overview', label: 'Overview', icon: 'home' },
			{ id: 'incidents', label: 'Incidents', icon: 'warning', badge: 2, tone: 'danger' },
		],
	},
	{
		label: 'Infrastructure',
		items: [
			{ id: 'services', label: 'Services', icon: 'layout-grid', badge: 6 },
			{ id: 'deploys', label: 'Deploys', icon: 'git-commit' },
			{ id: 'logs', label: 'Logs', icon: 'file-text' },
		],
	},
	{
		label: 'Account',
		items: [{ id: 'settings', label: 'Settings', icon: 'settings' }],
	},
];
