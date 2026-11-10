import type { FilterChipOption } from '@dorsk/tsumikit';

export const statuses: FilterChipOption[] = [
	{ id: 'all', label: 'All', count: 3047 },
	{ id: 'missing', label: 'Missing', count: 924 },
	{ id: 'complete', label: 'Complete', count: 2104 },
	{ id: 'unmonitored', label: 'Unmonitored', count: 19 },
];

export const formats: FilterChipOption[] = [
	{ id: 'flac', label: 'FLAC', count: 1812 },
	{ id: 'mp3', label: 'MP3', count: 1090 },
	{ id: 'opus', label: 'Opus', count: 126 },
	{ id: 'aac', label: 'AAC', count: 0 },
	{ id: 'dsd', label: 'DSD', disabled: true },
];

export const genres: FilterChipOption[] = [
	{ id: 'all', label: 'All genres', count: 3047 },
	{ id: 'ambient', label: 'Ambient', count: 412 },
	{ id: 'city-pop', label: 'City pop', count: 268 },
	{ id: 'drum-and-bass', label: 'Drum and bass', count: 197 },
	{ id: 'jazz', label: 'Jazz', count: 603 },
	{ id: 'post-rock', label: 'Post-rock', count: 154 },
	{ id: 'shoegaze', label: 'Shoegaze', count: 88 },
	{ id: 'soundtrack', label: 'Soundtrack', count: 731 },
	{ id: 'techno', label: 'Techno', count: 594 },
];
