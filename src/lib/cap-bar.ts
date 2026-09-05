export function clampCap(value: number, min = 0, max = 100): number {
	if (Number.isNaN(value)) return min;
	return Math.min(max, Math.max(min, value));
}

export function snapCap(value: number, step = 5, min = 0, max = 100): number {
	const s = step > 0 ? step : 1;
	return clampCap(min + Math.round((value - min) / s) * s, min, max);
}

export function capFromPointer(
	clientX: number,
	rect: { left: number; width: number },
	step = 5,
	min = 0,
	max = 100,
): number {
	if (rect.width <= 0) return min;
	const ratio = (clientX - rect.left) / rect.width;
	return snapCap(min + ratio * (max - min), step, min, max);
}

export function capKeyStep(
	key: string,
	shift: boolean,
	current: number,
	step = 5,
	min = 0,
	max = 100,
): number | null {
	const delta = shift ? step * 5 : step;
	switch (key) {
		case 'ArrowRight':
		case 'ArrowUp':
			return snapCap(current + delta, step, min, max);
		case 'ArrowLeft':
		case 'ArrowDown':
			return snapCap(current - delta, step, min, max);
		case 'Home':
			return min;
		case 'End':
			return max;
		case 'PageUp':
			return snapCap(current + step * 5, step, min, max);
		case 'PageDown':
			return snapCap(current - step * 5, step, min, max);
		default:
			return null;
	}
}

export function capTone(value: number, cap: number, warnAt = 75): 'ok' | 'warn' | 'danger' {
	if (value >= cap) return 'danger';
	if (value >= warnAt) return 'warn';
	return 'ok';
}
