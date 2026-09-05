import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { relativeTime } from '../src/lib/timestamp.ts';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [tooltip, progress, iconButton, icon, checkbox, tabs, metric, card, text, slider, timestamp, cluster, stack, field, seg, radio, nav, dot, autoGrid, modal, badge, segProg, index] =
	await Promise.all([
		read('components/molecules/Tooltip.svelte'),
		read('components/atoms/Progress.svelte'),
		read('components/molecules/IconButton.svelte'),
		read('components/atoms/Icon.svelte'),
		read('components/atoms/Checkbox.svelte'),
		read('components/molecules/Tabs.svelte'),
		read('components/molecules/Metric.svelte'),
		read('components/atoms/Card.svelte'),
		read('components/atoms/Text.svelte'),
		read('components/atoms/Slider.svelte'),
		read('components/molecules/Timestamp.svelte'),
		read('components/layouts/Cluster.svelte'),
		read('components/layouts/Stack.svelte'),
		read('components/molecules/Field.svelte'),
		read('components/molecules/SegmentedControl.svelte'),
		read('components/molecules/RadioGroup.svelte'),
		read('components/layouts/NavItem.svelte'),
		read('components/atoms/Dot.svelte'),
		read('components/layouts/AutoGrid.svelte'),
		read('components/molecules/Modal.svelte'),
		read('components/atoms/Badge.svelte'),
		read('components/atoms/SegmentedProgress.svelte'),
		read('index.ts')
	]);

test('kusaritoi nits: Tooltip inline/width/tabindex fallback', () => {
	assert.match(tooltip, /inline\?: boolean;/);
	assert.match(tooltip, /maxWidth\?: string;/);
	assert.match(tooltip, /if \(!target\) {\s*node\.tabIndex = 0;\s*target = node;/);
	assert.match(tooltip, /\.tip-wrap\.inline\s*{\s*flex: none;/);
});

test('kusaritoi nits: Progress color/showValue, IconButton spin/loading, Icon filled/tone', () => {
	assert.match(progress, /color\?: string;/);
	assert.match(progress, /showValue\?: boolean;/);
	assert.match(progress, /style:--fill={color}/);
	assert.match(iconButton, /spin\?: boolean;/);
	assert.match(iconButton, /loading\?: boolean;/);
	assert.match(iconButton, /<Icon name={icon} {size} {spin} \/>/);
	assert.match(icon, /filled\?: boolean;/);
	assert.match(icon, /tone\?: Tone;/);
	assert.match(icon, /const filled = \$derived\(filledProp \?\? \(name \? FILLED\.has\(name\) : false\)\)/);
});

test('kusaritoi nits: Checkbox labelHidden, TabItem count, Metric href, Card min-width/overflow, Text mono, Slider width', () => {
	assert.match(checkbox, /labelHidden\?: boolean;/);
	assert.match(checkbox, /class:sr-only={labelHidden}/);
	assert.match(tabs, /count\?: number \| string;/);
	assert.match(tabs, /{#if t\.count !== undefined}<Badge size="sm"/);
	assert.match(metric, /href\?: string;/);
	assert.match(metric, /as={href \? 'a' : onclick \? 'button' : 'div'}/);
	assert.match(metric, /\.metric-num\s*{\s*min-width: 0;\s*overflow-wrap: anywhere;/);
	assert.match(card, /overflow\?: 'visible' \| 'hidden';/);
	assert.match(card, /\.card\s*{[^}]*min-width: 0;/s);
	assert.match(text, /mono\?: boolean;/);
	assert.match(slider, /width\?: string;/);
	assert.match(slider, /marks\?: { value: number; label: string }\[\];/);
});

test('kusaritoi nits: Timestamp short relative', () => {
	assert.match(timestamp, /short\?: boolean;/);
	const now = Date.UTC(2026, 0, 1, 12, 0, 0);
	assert.equal(relativeTime(now - 6 * 60_000, now, false, true), '6m');
	assert.equal(relativeTime(now - 6 * 60_000, now), '6m ago');
	assert.equal(relativeTime(now + 2 * 3_600_000, now, false, true), '+2h');
});

test('kusaritoi nits: layout grow/shrink/fill/push and data-grow children, wrapAt', () => {
	for (const src of [cluster, stack]) {
		assert.match(src, /fill\?: boolean;/);
		assert.match(src, /push\?: 'start' \| 'end';/);
		assert.match(src, /shrink\?: boolean;/);
		assert.match(src, /> :global\(\[data-grow\]\)\s*{\s*flex: 1 1 0;/);
		assert.match(src, /> :global\(\[data-shrink='false'\]\)\s*{\s*flex: none;/);
		assert.match(src, /style\?: string;/);
	}
	assert.match(cluster, /wrapAt\?: string;/);
	assert.match(cluster, /const wrapping = \$derived\(wrapAt \? narrow : wrap\)/);
	assert.match(field, /shrink\?: boolean;/);
});

test('kusaritoi nits: atoms expose typed attribute surfaces instead of an index signature', async () => {
	for (const f of ['Badge', 'Card', 'Dot', 'Heading', 'Link', 'Text', 'Artwork', 'Gauge', 'Icon', 'Skeleton']) {
		const src = await read(`components/atoms/${f}.svelte`);
		assert.doesNotMatch(src, /\[key: string\]: unknown/, `${f} still has an index signature`);
		assert.match(src, /keyof Own> & Own = \$props\(\)/, `${f} typed surface`);
	}
});

test('cctui nits: SegmentedControl onchange/justify/wrap, RadioGroup swatch, NavItem vertical, Dot interactive', () => {
	assert.match(seg, /onchange\?: \(value: string\) => void;/);
	assert.match(seg, /justify\?: 'start' \| 'end';/);
	assert.match(seg, /wrap\?: boolean;/);
	assert.match(seg, /value = val;\s*onchange\?\.\(val\);/);
	assert.match(radio, /variant\?: 'list' \| 'rows' \| 'swatch';/);
	assert.match(radio, /color\?: string;/);
	assert.match(radio, /class="swatch-chip"/);
	assert.match(nav, /orientation\?: 'horizontal' \| 'vertical';/);
	assert.match(nav, /\.nav-item\.vertical\s*{\s*flex-direction: column;/);
	assert.match(dot, /interactive\?: boolean;/);
	assert.match(dot, /tabindex={interactive \? 0 : undefined}/);
});

test('cctui nits: AutoGrid template, Tabs panelPadding, Modal maxHeight, Badge href/external, SegmentedProgress rest, filterQuery namespace', () => {
	assert.match(autoGrid, /template\?: string;/);
	assert.match(autoGrid, /template \? `grid-template-columns: \${template}` : null/);
	assert.match(tabs, /panelPadding\?: 'none' \| 'sm' \| 'md';/);
	assert.match(modal, /maxHeight\?: string;/);
	assert.match(modal, /style:max-height={maxHeight}/);
	assert.match(badge, /href\?: string;/);
	assert.match(badge, /external\?: boolean;/);
	assert.match(badge, /this={href \? 'a' : as}/);
	assert.match(segProg, /\[key: string\]: unknown;/);
	assert.match(segProg, /{\.\.\.rest}/);
	assert.match(index, /export \* as filterQuery from '\.\/query';/);
});
