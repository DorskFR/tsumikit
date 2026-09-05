// Fish-style path abbreviation candidates, richest → poorest. The WorkingDir
// molecule picks the first entry that fits its measured width; the last entry
// (the leaf clipped to `minLeaf` chars) is the hard floor.
import { truncate } from './truncate';

export interface WorkingDirOptions {
	/** Visible chars the truncated leaf keeps before the ellipsis, at minimum. Default 18. */
	minLeaf?: number;
}

/** Trailing slashes dropped; an empty or root-only path becomes `/`. */
export function normalizeWorkingDir(path: string): string {
	return path.replace(/\/+$/, '') || '/';
}

/**
 * Candidate renderings of `path`:
 *   full path → ancestors abbreviated to their first letter one at a time,
 *   left to right → leaf only → leaf end-truncated down to `minLeaf` chars.
 */
export function workingDirCandidates(path: string, options: WorkingDirOptions = {}): string[] {
	const { minLeaf = 18 } = options;
	const trimmed = path.replace(/\/+$/, '');
	const absolute = trimmed.startsWith('/');
	const segs = trimmed.split('/').filter(Boolean);
	if (segs.length === 0) return [trimmed || '/'];
	const leaf = segs[segs.length - 1];
	const parents = segs.slice(0, -1);
	const out: string[] = [];
	const push = (c: string) => {
		if (out[out.length - 1] !== c) out.push(c);
	};
	for (let n = 0; n <= parents.length; n++) {
		const shown = parents.map((p, i) => (i < n ? [...p][0] : p));
		const joined = [...shown, leaf].join('/');
		push(absolute ? `/${joined}` : joined);
	}
	push(leaf);
	for (let keep = [...leaf].length - 1; keep >= minLeaf; keep--) {
		push(truncate(leaf, { max: keep + 1, mode: 'end' }));
	}
	return out;
}
