import type { SelectOption } from '@dorsk/tsumikit';

export const regions: SelectOption[] = [
	{ value: 'eu-west-1', label: 'Ireland', group: 'Europe', hint: 'eu-west-1' },
	{ value: 'eu-central-1', label: 'Frankfurt', group: 'Europe', hint: 'eu-central-1' },
	{ value: 'us-east-1', label: 'N. Virginia', group: 'Americas', hint: 'us-east-1' },
	{ value: 'us-west-2', label: 'Oregon', group: 'Americas', hint: 'us-west-2' },
	{ value: 'ap-northeast-1', label: 'Tokyo', group: 'Asia Pacific', hint: 'ap-northeast-1' },
	{
		value: 'ap-southeast-2',
		label: 'Sydney',
		group: 'Asia Pacific',
		hint: 'ap-southeast-2',
		disabled: true,
	},
];

export const accounts: SelectOption[] = [
	{ value: 'auto', label: 'Auto', emoji: '✨' },
	{ value: 'personal', label: 'personal', group: 'Accounts', emoji: '🐼', hint: '62%' },
	{ value: 'work', label: 'work', group: 'Accounts', icon: 'users', hint: '18%' },
	{ value: 'pool-eu', label: 'eu-pool', group: 'Pools', hint: '3 seats' },
	{ value: 'pool-us', label: 'us-pool', group: 'Pools', hint: '1 seat' },
	{
		value: 'archive',
		label: 'archive',
		group: 'Accounts',
		emoji: '📦',
		hint: '100%',
		disabled: true,
	},
];

export const sizes = [
	{ value: 'small', label: 'Small · 2 vCPU · 4 GB' },
	{ value: 'medium', label: 'Medium · 4 vCPU · 16 GB' },
	{ value: 'large', label: 'Large · 8 vCPU · 32 GB' },
];
