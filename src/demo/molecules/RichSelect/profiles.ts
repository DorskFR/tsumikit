export type Profile = {
	id: string;
	name: string;
	model: string;
	machine: string;
	badge: { label: string; tone: 'accent' | 'ok' | 'warn' | 'info' | 'muted' };
};

export const PROFILES: Profile[] = [
	{
		id: 'deep',
		name: 'Deep work',
		model: 'claude-opus-5-5',
		machine: 'dev1',
		badge: { label: '1M ctx', tone: 'accent' },
	},
	{
		id: 'daily',
		name: 'Daily driver',
		model: 'claude-sonnet-5-5',
		machine: 'dev1',
		badge: { label: 'default', tone: 'ok' },
	},
	{
		id: 'review',
		name: 'PR reviewer',
		model: 'claude-fable-5-1',
		machine: 'cyberia-k3s',
		badge: { label: 'read-only', tone: 'info' },
	},
	{
		id: 'quick',
		name: 'Quick fixes',
		model: 'claude-haiku-5-5',
		machine: 'laptop',
		badge: { label: 'cheap', tone: 'muted' },
	},
	{
		id: 'night',
		name: 'Overnight batch',
		model: 'claude-opus-5-5',
		machine: 'cyberia-k3s',
		badge: { label: 'yolo', tone: 'warn' },
	},
];
