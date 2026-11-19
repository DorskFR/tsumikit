import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { normalize, readDocs, rule } from './helpers.mjs';
import { readDemo } from './helpers/demo-source.js';

/** @param {string} p */
const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');
const [badge, popover, menu, fontScale, themePicker, readme, showcase] = await Promise.all([
	read('../src/lib/components/atoms/Badge.svelte'),
	read('../src/lib/components/molecules/Popover.svelte'),
	read('../src/lib/components/molecules/Menu.svelte'),
	read('../src/lib/components/molecules/FontScalePicker.svelte'),
	read('../src/lib/components/molecules/ThemePicker.svelte'),
	readDocs('styling.md'),
	readDemo()
]);

test('Badge sets its type from the root scale on the base chip', () => {
	const base = rule(badge, '.badge');
	assert.equal(base['font-size'], 'var(--fs-xs)');
	assert.equal(base['font-weight'], 'var(--fw-medium)');
});

test('Badge sm/xs keep the xs type step', () => {
	assert.match(normalize(badge), /\.badge-sm, \.badge-xs \{ font-size: var\(--fs-xs\);/);
});

test('Badge variant typography keeps its own weight', () => {
	assert.equal(rule(badge, '.mono')['font-weight'], 'var(--fw-normal)');
	assert.equal(rule(badge, '.uppercase')['font-weight'], 'var(--fw-semibold)');
});

test('Badge numeric is 1.5em wide, centred, on the chip ladder height', () => {
	const numeric = rule(badge, '.numeric');
	assert.equal(numeric['min-width'], '1.5em');
	assert.equal(numeric['min-height'], 'var(--chip-md)');
	assert.equal(numeric['justify-content'], 'center');
	assert.equal(rule(badge, '.numeric.badge-sm')['min-height'], 'var(--chip-sm)');
	assert.equal(rule(badge, '.numeric.badge-xs')['min-height'], 'var(--chip-xs)');
});

test('Badge reads and declares no --badge-* variable', () => {
	assert.doesNotMatch(badge, /--badge-/);
});

test('the docs publish no Badge style hooks', () => {
	assert.doesNotMatch(readme, /--badge-/);
});

test('the showcase sets no Badge hook and still shows the numeric chip', () => {
	assert.doesNotMatch(showcase, /--badge-/);
	assert.match(normalize(showcase), /<Badge numeric /);
});

for (const [name, src] of [
	['FontScalePicker', fontScale],
	['ThemePicker', themePicker]
]) {
	test(`${name} takes its trigger chrome as a Pick<> of Popover's own props`, () => {
		assert.match(normalize(src), /type TriggerChrome = Pick< ComponentProps<typeof Popover>,/);
		for (const prop of ['box', 'pill', 'placement', 'variant', 'tone', 'size', 'control', 'block', 'bare']) {
			assert.match(normalize(src), new RegExp(`'${prop}'`), `${name} does not forward ${prop}`);
		}
	});

	test(`${name} keeps box="md" / bottom-end as defaults, so an unset instance is unchanged`, () => {
		assert.match(normalize(src), /box = 'md',/);
		assert.match(normalize(src), /placement = 'bottom-end',/);
		assert.doesNotMatch(src, /box="md"/);
		assert.doesNotMatch(src, /placement="bottom-end"/);
	});

	test(`${name} forwards box/style/class onto the Popover trigger`, () => {
		const tag = normalize(src).match(/<Popover[^>]*>/)?.[0] ?? '';
		assert.match(tag, /\{box\}/, 'box not forwarded');
		assert.match(tag, /\{pill\}/, 'pill not forwarded');
		assert.match(tag, /\{placement\}/, 'placement not forwarded');
		assert.match(tag, /style=\{styleProp\}/, 'style not forwarded');
		assert.match(tag, /triggerClass=\{klass\}/, 'class no longer lands on the trigger');
	});
}

test('Popover takes a pill prop and puts --r-pill on the trigger', () => {
	assert.match(normalize(popover), /pill = false,/);
	assert.match(normalize(popover), /pill\?: boolean;/);
	assert.match(normalize(popover), /class:trigger-pill=\{pill\}/);
	assert.equal(rule(popover, '.pop-trigger.trigger-pill')['border-radius'], 'var(--r-pill)');
});

test('the pill rule outranks the zero-specificity default radius, so it composes with every chrome prop', () => {
	assert.match(normalize(popover), /:where\(\.pop-trigger:not\(\.bare\)\) \{[^}]*border-radius: var\(--r-md\);/);
	const pillAt = popover.indexOf('.pop-trigger.trigger-pill');
	for (const sel of ['.pop-trigger.canonical {', '.pop-trigger.trigger-box {', '.pop-trigger.trigger-sm {']) {
		assert.ok(popover.includes(sel), sel);
		assert.equal(rule(popover, sel.slice(0, -2))['border-radius'], undefined, `${sel} would fight pill`);
	}
	assert.ok(pillAt > 0);
});

test('Menu forwards pill through its TriggerChrome Pick<>', () => {
	assert.match(normalize(menu), /\| 'box' \| 'pill' \| 'control'/);
	assert.match(normalize(menu), /size, box, pill, control,/);
	assert.match(normalize(menu).match(/<Popover[^>]*>/)?.[0] ?? '', /\{pill\}/);
});

test('the default trigger paints a transparent ghost from root tokens', () => {
	const base = normalize(popover).match(/:where\(\.pop-trigger:not\(\.bare\)\) \{([^}]*)\}/)?.[1] ?? '';
	assert.match(base, /border: var\(--edge-width\) solid transparent;/);
	assert.match(base, /background: transparent;/);
	assert.match(base, /color: var\(--text\);/);
	assert.match(base, /font-size: inherit;/);
});

test('the canonical and variant triggers paint from the button role tokens', () => {
	const canonical = rule(popover, '.pop-trigger.canonical');
	assert.equal(canonical.background, 'var(--btn-fill)');
	assert.equal(canonical['border-color'], 'var(--btn-edge)');
	assert.equal(canonical['font-size'], 'var(--control-fs-md)');

	const primary = rule(popover, '.pop-trigger.trigger-primary');
	assert.equal(primary.background, 'var(--btn-primary-fill)');
	assert.equal(primary.color, 'var(--text-on-accent)');

	assert.equal(rule(popover, '.pop-trigger.trigger-sm')['font-size'], 'var(--control-fs-sm)');
	assert.equal(rule(popover, '.pop-trigger.trigger-lg')['font-size'], 'var(--control-fs-lg)');
	assert.equal(rule(popover, '.pop-trigger.trigger-danger').color, 'var(--danger)');
});

test('a bare trigger is stripped to inherited text', () => {
	const bare = normalize(popover).match(/:where\(\.pop-trigger\.bare\) \{([^}]*)\}/)?.[1] ?? '';
	assert.match(bare, /border-radius: 0;/);
	assert.match(bare, /background: none;/);
	assert.match(bare, /color: inherit;/);
	assert.match(bare, /font: inherit; font-size: inherit;/);
	assert.match(bare, /border: 0;/);
});

test('Popover reads no --pop-* variable and the docs publish none', () => {
	assert.doesNotMatch(popover.slice(popover.indexOf('<style>')), /--pop-/);
	assert.doesNotMatch(readme, /--pop-/);
});

test('every padding tier writes its own padding', () => {
	for (const [selector, padding] of [
		[':where(.pop-trigger:not(.bare))', 'var(--sp-1)'],
		['.pop-trigger.canonical', 'var(--sp-2) var(--btn-px-md)'],
		['.pop-trigger.trigger-sm', 'var(--sp-1) var(--btn-px-sm)'],
		['.pop-trigger.trigger-lg', 'var(--sp-3) var(--btn-px-lg)'],
		['.pop-trigger.trigger-control', '0 var(--sp-3)'],
		['.pop-trigger.trigger-box', '0'],
		[':where(.pop-trigger.bare)', '0']
	]) {
		assert.equal(rule(popover, selector).padding, padding, selector);
	}
});

test('the default trigger floors at the sm box and grows with its content', () => {
	const sized = normalize(popover).match(/:where\(\.pop-trigger:not\(\.bare\)\) \{([^}]*)\}/)?.[1] ?? '';
	assert.match(sized, /display: inline-flex;/);
	assert.match(sized, /min-height: var\(--box-sm\);/);
	assert.match(sized, /min-width: var\(--box-sm\);/);
	assert.equal(rule(popover, ':where(.pop-trigger:not(.bare))')['line-height'], undefined);
	assert.equal(rule(popover, ':where(.pop-trigger:not(.bare))').height, undefined);
});

test('the showcase sets no Popover trigger hook', () => {
	assert.doesNotMatch(showcase, /--pop-(?:box|trigger-)/);
});

test('triggerClass no longer claims a consumer scoped stylesheet reaches the trigger', () => {
	assert.doesNotMatch(popover, /no :global needed/);
	assert.doesNotMatch(readme, /no `?:global`? needed/);
	assert.match(normalize(popover), /scoped\* CSS cannot reach it/);
	assert.match(normalize(readme), /Your component's \*scoped\* CSS cannot reach it/);
});
