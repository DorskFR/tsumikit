export type Person = {
	handle: string;
	name: string;
	role: string;
	hue: number;
	emoji?: string;
	online?: boolean;
};
export const people: Person[] = [
	{
		handle: 'amara',
		name: 'Amara Okafor',
		role: 'Platform lead',
		hue: 210,
		emoji: '🦉',
		online: true,
	},
	{ handle: 'jun', name: 'Jun Tanaka', role: 'SRE', hue: 140, emoji: '🐙', online: true },
	{ handle: 'lena', name: 'Lena Fischer', role: 'Designer', hue: 300, emoji: '🦊' },
	{ handle: 'mateo', name: 'Mateo Ruiz', role: 'Backend', hue: 30 },
	{ handle: 'priya', name: 'Priya Nair', role: 'Data', hue: 260, online: false },
	{ handle: 'sam', name: 'Sam Doyle', role: 'Support', hue: 90 },
];

export type ServiceStatus = 'ok' | 'warn' | 'danger';
export type Service = {
	id: number;
	name: string;
	role: 'service' | 'worker' | 'cache' | 'database' | 'gateway';
	region: string;
	status: ServiceStatus;
	cpu: number;
	memoryMb: number;
	uptimeDays: number;
};
export const services: Service[] = [
	{
		id: 1,
		name: 'api-gateway',
		role: 'gateway',
		region: 'eu-west-1',
		status: 'ok',
		cpu: 23,
		memoryMb: 412,
		uptimeDays: 41,
	},
	{
		id: 2,
		name: 'worker-02',
		role: 'worker',
		region: 'eu-west-1',
		status: 'warn',
		cpu: 87,
		memoryMb: 1930,
		uptimeDays: 3,
	},
	{
		id: 3,
		name: 'cache-01',
		role: 'cache',
		region: 'us-east-1',
		status: 'danger',
		cpu: 4,
		memoryMb: 7900,
		uptimeDays: 0,
	},
	{
		id: 4,
		name: 'postgres-primary',
		role: 'database',
		region: 'eu-west-1',
		status: 'ok',
		cpu: 38,
		memoryMb: 15800,
		uptimeDays: 120,
	},
	{
		id: 5,
		name: 'media-transcode',
		role: 'service',
		region: 'ap-northeast-1',
		status: 'ok',
		cpu: 64,
		memoryMb: 2210,
		uptimeDays: 12,
	},
	{
		id: 6,
		name: 'search-index',
		role: 'service',
		region: 'us-east-1',
		status: 'warn',
		cpu: 55,
		memoryMb: 3300,
		uptimeDays: 7,
	},
];

export type FileItem = { name: string; size: number; type: string; url?: string };
export const files: FileItem[] = [
	{
		name: 'screenshot-2026-09-25-at-14.02.11.png',
		size: 1_284_311,
		type: 'image/png',
		url: 'https://picsum.photos/seed/tsu-152/96',
	},
	{ name: 'quarterly-report.pdf', size: 88_120, type: 'application/pdf' },
	{ name: 'meeting-notes.md', size: 2_048, type: 'text/markdown' },
	{ name: 'export.csv', size: 402_133, type: 'text/csv' },
	{ name: 'demo-reel.mp4', size: 48_300_112, type: 'video/mp4' },
];

export type Track = {
	id: number;
	title: string;
	artist: string;
	album: string;
	durationS: number;
	hue: number;
};
export const tracks: Track[] = [
	{ id: 1, title: 'Night Drive', artist: 'Kaleido', album: 'Neon Rain', durationS: 243, hue: 280 },
	{
		id: 2,
		title: 'Paper Boats',
		artist: 'June Hollow',
		album: 'Low Tide',
		durationS: 198,
		hue: 190,
	},
	{ id: 3, title: 'Static Bloom', artist: 'Kaleido', album: 'Neon Rain', durationS: 312, hue: 20 },
	{ id: 4, title: 'Lantern', artist: 'Oro Valley', album: 'Lantern', durationS: 171, hue: 45 },
	{
		id: 5,
		title: 'Halfway Home',
		artist: 'June Hollow',
		album: 'Low Tide',
		durationS: 265,
		hue: 120,
	},
];

export type Message = {
	id: number;
	role: 'user' | 'assistant' | 'tool' | 'system';
	text: string;
	at: number;
	ms?: number;
};
const minutes = (n: number) => Date.UTC(2026, 9, 21, 9, 0) - n * 60_000;
export const messages: Message[] = [
	{
		id: 1,
		role: 'user',
		text: 'Can you summarise the **release notes** for 0.62?',
		at: minutes(5),
	},
	{
		id: 2,
		role: 'assistant',
		text: 'Sure. Highlights:\n\n- `renderMarkdown` helper, zero deps\n- `ConversationFeed` + `ConversationPanel` organisms\n- `Composer` toolbar row\n\n| Area | Change |\n|---|---|\n| ChatBubble | `timestamp`, `footer`, `markdown` |\n| StatusBar | new |',
		at: minutes(4),
		ms: 1240,
	},
	{ id: 3, role: 'tool', text: 'Read src/lib/index.ts (220 lines)', at: minutes(3) },
	{
		id: 4,
		role: 'assistant',
		text: 'Links are scheme-checked: [docs](https://dorskfr.github.io/tsumikit) works, `[x](javascript:alert(1))` stays text.\n\n```ts\nconst html = renderMarkdown(md);\n```',
		at: minutes(2),
		ms: 980,
	},
	{ id: 5, role: 'system', text: 'Context compacted', at: minutes(1) },
];

export type Provider = {
	name: string;
	usedPct: number;
	cap: number | null;
	resetsIn: string;
	expectedPct?: number;
};
export const providers: Provider[] = [
	{ name: 'Anthropic', usedPct: 62, cap: 80, resetsIn: '3h', expectedPct: 55 },
	{ name: 'OpenAI', usedPct: 81, cap: 90, resetsIn: '12h', expectedPct: 65 },
	{ name: 'Gemini', usedPct: 44, cap: null, resetsIn: '1d' },
	{ name: 'Mistral', usedPct: 95, cap: 80, resetsIn: '6h' },
];

export const sampleCode = `import { Button, theme } from '@dorsk/tsumikit';

function greet(name: string) {
  return \`Hello, \${name}!\`;
}`;
