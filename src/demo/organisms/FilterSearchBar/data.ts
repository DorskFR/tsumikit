import type { Schema } from '@dorsk/tsumikit';

export { type Service, services } from '../../fixtures';

const options = (...values: string[]) => values.map((value) => ({ value, label: value }));

export const fleetSchema: Schema = {
	fields: [
		{ name: 'name', label: 'Service', type: 'string', aliases: ['service'] },
		{
			name: 'role',
			label: 'Role',
			type: 'enum',
			options: options('service', 'worker', 'cache', 'database', 'gateway'),
		},
		{
			name: 'region',
			label: 'Region',
			type: 'enum',
			options: options('eu-west-1', 'us-east-1', 'ap-northeast-1'),
		},
		{ name: 'status', label: 'Status', type: 'enum', options: options('ok', 'warn', 'danger') },
		{ name: 'cpu', label: 'CPU %', type: 'number', valuePlaceholder: '0–100' },
		{ name: 'uptimeDays', label: 'Uptime (days)', type: 'number', aliases: ['uptime'] },
	],
};

export const presets = ['status!=ok', 'role:worker', 'region=eu-west-1 cpu>=30', 'uptime<7'];
