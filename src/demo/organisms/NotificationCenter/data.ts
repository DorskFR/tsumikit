import type { NotificationData } from '@dorsk/tsumikit';

const HOUR = 3_600_000;

export function seed(now = Date.now()): NotificationData[] {
	return [
		{
			id: 'deploy',
			icon: 'lock',
			tone: 'warning',
			title: 'Deploy api@4.12.0 to production',
			text: 'The release pipeline is waiting for a second approval before it rolls out to the eu-west and us-east clusters.',
			time: now - 4 * 60_000,
			unread: true,
			actions: [
				{ id: 'approve', label: 'Approve', variant: 'primary' },
				{ id: 'reject', label: 'Reject', variant: 'danger', requiresConfirm: true },
			],
		},
		{
			id: 'disk',
			tone: 'danger',
			title: 'Disk almost full on build-runner-3',
			text: '98% used on /var/lib/docker.',
			time: now - 40 * 60_000,
			unread: true,
			actions: [
				{ id: 'open', label: 'Open' },
				{ id: 'snooze', label: 'Snooze 1h' },
				{ id: 'mute', label: 'Mute this runner' },
			],
		},
		{
			id: 'backup',
			tone: 'info',
			title: 'Nightly backup finished',
			text: '3.2 GB written to the cold tier in 4 min.',
			time: now - 26 * HOUR,
		},
		{
			id: 'token',
			icon: 'key-round',
			tone: 'success',
			title: 'Rotate the deploy token',
			time: now - 28 * HOUR,
			state: 'Approved on phone',
			actions: [{ id: 'approve', label: 'Approve' }],
		},
	];
}

export function older(start: number, count = 3): NotificationData[] {
	return Array.from({ length: count }, (_, i) => ({
		id: `old-${start + i}`,
		tone: 'neutral' as const,
		title: `Weekly report #${start + i} is ready`,
		time: Date.now() - (3 + start + i) * 24 * HOUR,
	}));
}
