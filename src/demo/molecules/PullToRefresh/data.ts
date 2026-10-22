export type FeedEvent = { id: number; who: string; what: string; when: string };

export const feed: FeedEvent[] = [
	{ id: 6, who: 'jun', what: 'restarted worker-02', when: '09:41' },
	{ id: 5, who: 'ci', what: 'deployed api-gateway 3.14.2 to eu-west-1', when: '09:28' },
	{ id: 4, who: 'amara', what: 'approved the cache-01 failover runbook', when: '09:02' },
	{ id: 3, who: 'priya', what: 'exported 12,480 rows to export.csv', when: '08:47' },
	{ id: 2, who: 'ci', what: 'nightly backup of postgres-primary finished', when: '03:00' },
	{ id: 1, who: 'mateo', what: 'merged fix/retry-budget', when: 'yesterday' },
];

export const incoming: Omit<FeedEvent, 'id' | 'when'>[] = [
	{ who: 'lena', what: 'uploaded onboarding-v2.fig' },
	{ who: 'ci', what: 'media-transcode build #812 passed' },
	{ who: 'sam', what: 'closed ticket SUP-2291' },
];
