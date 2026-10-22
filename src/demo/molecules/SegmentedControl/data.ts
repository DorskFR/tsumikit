import type { SegmentOption } from '@dorsk/tsumikit';

export const libraryFilters: SegmentOption[] = [
	{ value: 'all', label: 'All', count: 742 },
	{ value: 'monitored', label: 'Monitored', count: 646 },
	{ value: 'missing', label: 'Missing', count: 120 },
	{ value: 'cutoff', label: 'Cutoff unmet', count: 31 },
];

export const viewModes: SegmentOption[] = [
	{ value: 'grid', label: 'Grid', icon: 'grid' },
	{ value: 'list', label: 'List', icon: 'list' },
];

export const scopeModes: SegmentOption[] = [
	{ value: 'album', label: 'By album', icon: 'grid' },
	{ value: 'artist', label: 'By artist', icon: 'list' },
];

export const queueFilters: SegmentOption[] = [
	{ value: 'all', label: 'All', count: 1234 },
	{ value: 'queued', label: 'Queued', count: 3 },
	{ value: 'downloading', label: 'Downloading' },
	{ value: 'failed', label: 'Failed', count: 12 },
	{ value: 'completed', label: 'Completed' },
];
