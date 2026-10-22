export type DeployEvent = {
	id: number;
	at: string;
	level: 'info' | 'ok' | 'warn' | 'danger';
	text: string;
};

const steps: [DeployEvent['level'], string][] = [
	['info', 'Pulling harbor.dorsk.dev/cyberia/api-gateway:0.62.1'],
	['info', 'Image digest sha256:9f12e485… verified'],
	['info', 'Draining eu-west-1 pod api-gateway-7c9d (12 open connections)'],
	['warn', 'Readiness probe failed once on api-gateway-4b1e, retrying'],
	['ok', 'api-gateway-4b1e ready in 3.2s'],
	['info', 'Shifting 25% of traffic to 0.62.1'],
	['info', 'p95 latency 182ms (baseline 190ms)'],
	['info', 'Shifting 100% of traffic to 0.62.1'],
	['danger', 'cache-01 refused 3 connections during the shift'],
	['ok', 'Rollout complete'],
];

let seq = 0;
export function event(index: number): DeployEvent {
	const [level, text] = steps[index % steps.length];
	seq += 1;
	const s = 10 + seq * 7;
	return {
		id: seq,
		at: `09:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`,
		level,
		text,
	};
}

export const firstEvents = (n: number) => Array.from({ length: n }, (_, i) => event(i));
