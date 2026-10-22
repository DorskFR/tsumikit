export type AuditRow = { id: number; actor: string; action: string; at: string };

const actors = ['amara', 'jun', 'lena', 'mateo', 'priya', 'sam'];
const actions = [
	'signed in',
	'rotated an API key',
	'changed a cap',
	'deployed worker-02',
	'exported a report',
	'invited a member',
];

export const AUDIT: AuditRow[] = Array.from({ length: 47 }, (_, i) => ({
	id: 1000 + i,
	actor: actors[i % actors.length],
	action: actions[(i * 5) % actions.length],
	at: `2026-10-${String(21 - Math.floor(i / 6)).padStart(2, '0')} ${String(9 + (i % 9)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
}));
