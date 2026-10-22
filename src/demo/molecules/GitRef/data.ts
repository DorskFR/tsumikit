import type { DiffStats, PullRequest } from '@dorsk/tsumikit';

const repo = { owner: 'DorskFR', repo: 'tsumikit' };
const pr = (number: number, state: PullRequest['state']): PullRequest => ({
	url: `https://github.com/DorskFR/tsumikit/pull/${number}`,
	...repo,
	number,
	state,
});

export type Change = { title: string; branch: string; pr?: PullRequest; diff?: DiffStats };

export const changes: Change[] = [
	{
		title: 'Demo framework with a glob registry',
		branch: 'feat/demo-framework',
		pr: pr(81, 'merged'),
		diff: { additions: 1840, deletions: 312 },
	},
	{
		title: 'SeekSlider keeps the thumb on release',
		branch: 'fix/seek-release',
		pr: pr(84, 'open'),
		diff: { additions: 42, deletions: 9 },
	},
	{
		title: 'Experiment: canvas waveform',
		branch: 'spike/waveform-canvas',
		pr: pr(79, 'closed'),
		diff: { additions: 610, deletions: 0 },
	},
	{
		title: 'Sound palette v2',
		branch: 'feat/sound-palette-v2',
		pr: pr(86, 'draft'),
		diff: { additions: 7, deletions: 3 },
	},
	{ title: 'Local only, not pushed yet', branch: 'wip/truncate-measure' },
];
