export function hasCount(count: number | undefined | null): count is number {
	return typeof count === 'number' && Number.isFinite(count) && count > 0;
}

export function formatCount(count: number, max = 99): string {
	const n = Math.floor(count);
	return n > max ? `${max}+` : String(n);
}
