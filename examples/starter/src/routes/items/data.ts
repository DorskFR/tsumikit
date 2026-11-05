export type Status = 'open' | 'done';

export interface Item {
	id: number;
	title: string;
	status: Status;
}

const TITLES = [
	'Write the launch note',
	'Review the pricing page',
	'Fix the signup redirect',
	'Reply to the beta group',
	'Rotate the API keys',
	'Archive last quarter',
	'Draft the roadmap',
	'Check the backup restore',
	'Update the onboarding video',
	'Close the old support inbox',
	'Measure the empty-state copy',
	'Ship the undo toast',
];

export const ITEMS: Item[] = TITLES.map((title, i) => ({
	id: i + 1,
	title,
	status: i % 3 === 0 ? 'done' : 'open',
}));

export function fakeRequest(ms = 400): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
