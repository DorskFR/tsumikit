export type Mail = { id: number; from: string; subject: string; preview: string; at: string };

export const inbox: Mail[] = [
	{
		id: 1,
		from: 'Jun Tanaka',
		subject: 'worker-02 paged twice overnight',
		preview: 'CPU sat at 87% from 02:10 until the autoscaler kicked in.',
		at: '07:42',
	},
	{
		id: 2,
		from: 'Billing',
		subject: 'Your October invoice is ready',
		preview: 'Total due: €412.30, payable by 5 November.',
		at: '06:15',
	},
	{
		id: 3,
		from: 'Lena Fischer',
		subject: 'Onboarding flow, round two',
		preview: 'I pushed the new illustrations to the shared board.',
		at: 'Mon',
	},
	{
		id: 4,
		from: 'GitHub',
		subject: '[tsumikit] PR #81 merged',
		preview: 'feat: demo framework with glob registry',
		at: 'Sun',
	},
];
