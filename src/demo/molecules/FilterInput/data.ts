import type { Schema } from '@dorsk/tsumikit';

const options = (...values: string[]) => values.map((value) => ({ value, label: value }));

export const logSchema: Schema = {
	fields: [
		{
			name: 'level',
			label: 'Level',
			type: 'enum',
			options: options('debug', 'info', 'warn', 'error'),
		},
		{
			name: 'service',
			label: 'Service',
			type: 'enum',
			options: options('api-gateway', 'worker-02', 'cache-01'),
		},
		{ name: 'status', label: 'HTTP status', type: 'number' },
		{ name: 'message', label: 'Message', type: 'string', aliases: ['msg'] },
	],
};

export const machines = ['dev1', 'laptop', 'cyberia-k3s'];

const recent = [
	'/home/amara/Documents/tsumikit',
	'/home/amara/Documents/tsumikit/src/lib/components/molecules',
	'/home/amara/projects/cctui',
	'/srv/media library/incoming',
];

export const cwdSchema: Schema = {
	fields: [
		{
			name: 'cwd',
			label: 'Working directory',
			type: 'string',
			provider: (q) =>
				recent
					.filter((p) => p.toLowerCase().includes(q.toLowerCase()))
					.map((p) => ({ value: p, label: p.split('/').at(-1) ?? p, hint: p })),
		},
	],
};
