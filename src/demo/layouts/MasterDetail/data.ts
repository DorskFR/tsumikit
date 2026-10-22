export type Mail = {
	id: number;
	from: string;
	hue: number;
	subject: string;
	preview: string;
	time: string;
	unread?: boolean;
};

export const inbox: Mail[] = [
	{
		id: 1,
		from: 'Amara Okafor',
		hue: 210,
		subject: 'Failover drill moved to Thursday',
		preview: 'The read replica in eu-west-1 needs a fresh base backup before we run it again.',
		time: '09:42',
		unread: true,
	},
	{
		id: 2,
		from: 'GitHub',
		hue: 0,
		subject: '[tsumikit] Release v2.14.0',
		preview: 'Faster cold starts, notification digests and 38 other changes.',
		time: '08:15',
		unread: true,
	},
	{
		id: 3,
		from: 'Jun Tanaka',
		hue: 140,
		subject: 'Re: cache-01 memory pressure',
		preview: 'Bumped maxmemory to 12 GB and switched the eviction policy to allkeys-lfu.',
		time: 'Yesterday',
	},
	{
		id: 4,
		from: 'Lena Fischer',
		hue: 300,
		subject: 'New empty-state illustrations for the dashboard, onboarding and billing flows',
		preview: 'Six SVGs, all under 4 KB, tuned for both themes.',
		time: 'Mon',
	},
	{
		id: 5,
		from: 'Billing',
		hue: 45,
		subject: 'Your October invoice',
		preview: 'Team plan, 12 seats: €228.00, charged on November 1.',
		time: 'Oct 18',
	},
	{
		id: 6,
		from: 'Priya Nair',
		hue: 260,
		subject: 'Churn model, week 42',
		preview: 'Precision is up to 0.81; the notebook is in the shared drive.',
		time: 'Oct 16',
	},
];
