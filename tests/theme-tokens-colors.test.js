import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const src = await readFile(new URL('../src/demo/foundations/ThemeTokens/01-Colors.svelte', import.meta.url), 'utf8');

test('colour tokens are read after the theme switch has painted, not in the effect itself', () => {
	const effect = src.slice(src.indexOf('$effect('), src.indexOf('</script>', src.indexOf('$effect(')));
	const read = effect.indexOf('getComputedStyle(');
	assert.ok(read > 0);
	const frames = effect.slice(0, read).match(/requestAnimationFrame\(/g) ?? [];
	assert.equal(frames.length, 2);
	assert.match(effect, /return \(\) => cancelAnimationFrame\(frame\);/);
});
