export const efforts = [
	{ id: 'low', label: 'Low', hint: 'Fast, cheap' },
	{ id: 'medium', label: 'Medium', hint: 'Default' },
	{ id: 'high', label: 'High', hint: 'Thinks longer' },
	{ id: 'max', label: 'Max', hint: 'Best quality' },
];

export const permissions = [
	{
		value: 'ask',
		label: 'Ask',
		description: 'Confirm every tool call.',
		accent: 'var(--ok)',
		preview: 'Safest: nothing runs without a prompt.',
	},
	{
		value: 'edits',
		label: 'Auto-accept edits',
		description: 'File edits run, shell asks.',
		accent: 'var(--info)',
		preview: 'Edits apply silently; commands still prompt.',
	},
	{
		value: 'yolo',
		label: 'Yolo',
		description: 'Nothing asks.',
		accent: 'var(--danger)',
		preview: 'Everything runs. Use on throwaway branches.',
	},
];
