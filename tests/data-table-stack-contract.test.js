import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
	new URL('../src/lib/components/organisms/DataTable.svelte', import.meta.url),
	'utf8'
);

test('responsive defaults to scroll and stackBelow to 48rem', () => {
	assert.match(source, /responsive\?: 'scroll' \| 'stack'/);
	assert.match(source, /stackBelow\?: string/);
	assert.match(source, /responsive = 'scroll'/);
	assert.match(source, /stackBelow = '48rem'/);
	assert.match(source, /role\?: 'title' \| 'detail' \| 'meta' \| 'actions' \| 'hidden'/);
});

test('stack mode measures the table box with a ResizeObserver and flags the wrapper', () => {
	assert.match(source, /if \(responsive !== 'stack' \|\| !wrapEl\) {\s*stacked = false;\s*return;/);
	assert.match(source, /new ResizeObserver\(/);
	assert.match(source, /stacked = entry\.contentRect\.width < limit;/);
	assert.match(source, /return \(\) => observer\.disconnect\(\);/);
	assert.match(source, /length\.endsWith\('rem'\)/);
	assert.match(source, /class:dt-stack={responsive === 'stack'}/);
	assert.match(source, /data-stacked={stacked \|\| undefined}/);
});

test('cells carry data-role and data-label only in stack mode; the default DOM is unchanged', () => {
	assert.match(source, /data-role={responsive === 'stack' \? \(col\.role \?\? 'detail'\) : undefined}/);
	assert.match(source, /data-label={responsive === 'stack' \? col\.label : undefined}/);
	assert.match(source, /style:text-align={stacked \? undefined : \(col\.align \?\? 'left'\)}/);
	assert.match(source, /<table\s+class="dt"/);
	assert.match(source, /<thead data-part="head">/);
});

test('stacked rows keep table semantics and lay out as cards', () => {
	assert.match(source, /\[data-stacked\] thead\s*{[^}]*clip: rect\(0, 0, 0, 0\);/s);
	assert.doesNotMatch(source, /\[data-stacked\] thead\s*{[^}]*display: none/s);
	assert.match(source, /\[data-stacked\] tbody tr,\s*\[data-stacked\] tfoot tr\s*{[^}]*display: flex;[^}]*flex-wrap: wrap;/s);
	assert.match(source, /\[data-stacked\] td\[data-role='title'\]\s*{[^}]*font-weight: var\(--fw-semibold\);/s);
	assert.match(source, /\[data-stacked\] td\[data-role='detail'\]::before\s*{\s*content: attr\(data-label\) ': ';/);
	assert.match(source, /\[data-stacked\] td\[data-role='meta'\]\s*{[^}]*font-family: var\(--font-mono\);/s);
	assert.match(source, /\[data-stacked\] td\[data-role='actions'\],\s*\[data-stacked\] td\.dt-actions\s*{[^}]*margin-inline-start: auto;[^}]*opacity: 1;/s);
	assert.match(source, /\[data-stacked\] td\[data-role='hidden'\]\s*{\s*display: none;/);
	assert.doesNotMatch(source, /display: contents/);
});

test('stack padding applies to body/foot rows only and the whole thead is clipped', () => {
	assert.match(source, /\[data-stacked\] thead\s*{\s*position: absolute;/);
	assert.match(source, /\[data-stacked\] tbody tr,\s*\[data-stacked\] tfoot tr\s*{\s*display: flex;/);
	assert.doesNotMatch(source, /\[data-stacked\] tr\s*{/);
});

test('stack title cell keeps its content width so metas wrap instead of painting over it', () => {
	assert.match(source, /\[data-stacked\] td\[data-role='title'\]\s*{\s*flex: 1 1 auto;\s*min-width: min\(100%, 12rem\);/);
});
