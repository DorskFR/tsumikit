import type { Column } from '@dorsk/tsumikit';
import { type Service, services } from '../../fixtures';

export { type Service, services };

export const statusTone = { ok: 'ok', warn: 'warn', danger: 'danger' } as const;

export const memory = (s: Service) =>
	s.memoryMb >= 1024 ? `${(s.memoryMb / 1024).toFixed(1)} GB` : `${s.memoryMb} MB`;

export const overviewColumns: Column<Service>[] = [
	{ key: 'name', label: 'Service', width: '34%', truncate: true },
	{ key: 'role', label: 'Role', hideBelow: 'sm' },
	{ key: 'region', label: 'Region', hideBelow: 'md', nowrap: true },
	{ key: 'cpu', label: 'CPU', align: 'right', get: (s) => `${s.cpu}%` },
	{ key: 'status', label: 'Status', width: '6.5rem' },
];

export const stackColumns: Column<Service>[] = [
	{ key: 'name', label: 'Service', role: 'title' },
	{ key: 'status', label: 'Status', role: 'meta' },
	{ key: 'region', label: 'Region', role: 'meta', stackLabel: false },
	{ key: 'cpu', label: 'CPU', get: (s) => `${s.cpu}%` },
	{ key: 'memoryMb', label: 'Memory', get: memory },
	{ key: 'id', label: 'Id', role: 'hidden' },
];
