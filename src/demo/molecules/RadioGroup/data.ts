import type { RadioOption } from '@dorsk/tsumikit';

export const strategies: RadioOption[] = [
	{
		value: 'plan',
		label: 'Plan first',
		description: 'Draft an approach before touching files.',
	},
	{ value: 'edit', label: 'Edit directly', description: 'Skip planning, start editing.' },
	{ value: 'ask', label: 'Ask me', description: 'Clarify the ask before acting.' },
];

export const previews: Record<string, string> = {
	plan: 'The agent writes a step-by-step plan and waits for approval.',
	edit: 'The agent edits files immediately and reports back.',
	ask: 'The agent asks one question, then proceeds with the answer.',
};

export const profiles: RadioOption[] = [
	{
		value: 'personal',
		label: 'Personal',
		note: '12× this week',
		description: 'Claude Code · 🐼 personal · Fable 5 · medium · Yolo',
	},
	{
		value: 'work',
		label: 'Work',
		note: '3× this week',
		description: 'Claude Code · 🏢 work · Opus · high · Ask',
	},
	{
		value: 'review',
		label: 'Reviewer',
		description: 'OpenCode · locked-down reviewer · read-only',
	},
];
