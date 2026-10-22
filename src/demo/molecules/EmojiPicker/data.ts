import type { EmojiGroup } from '@dorsk/tsumikit';

export const statusGroups: readonly EmojiGroup[] = [
	{
		id: 'availability',
		label: 'Availability',
		icon: '🟢',
		entries: [
			{ emoji: '🟢', keys: 'available online disponible' },
			{ emoji: '🟡', keys: 'away idle absent' },
			{ emoji: '🔴', keys: 'busy do not disturb occupé' },
			{ emoji: '🌴', keys: 'vacation holiday vacances' },
			{ emoji: '🤒', keys: 'sick ill malade' },
			{ emoji: '🏠', keys: 'remote home maison' },
		],
	},
	{
		id: 'focus',
		label: 'Focus',
		icon: '🎧',
		entries: [
			{ emoji: '🎧', keys: 'focus headphones concentration' },
			{ emoji: '📞', keys: 'call meeting appel' },
			{ emoji: '🚨', keys: 'on-call incident astreinte' },
			{ emoji: '✈️', keys: 'travelling flight voyage' },
		],
	},
];
