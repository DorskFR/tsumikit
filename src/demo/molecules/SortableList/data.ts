export type Incident = {
	id: string;
	title: string;
	service: string;
	severity: 'SEV1' | 'SEV2' | 'SEV3';
	active?: boolean;
};

export const incidents: Incident[] = [
	{
		id: 'INC-412',
		title: 'Cache cluster unreachable',
		service: 'cache-01',
		severity: 'SEV1',
		active: true,
	},
	{ id: 'INC-415', title: 'Worker CPU saturated', service: 'worker-02', severity: 'SEV2' },
	{
		id: 'INC-409',
		title: 'Slow transcodes for 4K uploads',
		service: 'media-transcode',
		severity: 'SEV3',
	},
	{
		id: 'INC-417',
		title: 'Gateway 502s from one region',
		service: 'api-gateway',
		severity: 'SEV2',
	},
	{
		id: 'INC-401',
		title: 'Replica lag over 30 s during backups',
		service: 'postgres-primary',
		severity: 'SEV3',
	},
];

export const severityTone = { SEV1: 'danger', SEV2: 'warn', SEV3: 'info' } as const;
