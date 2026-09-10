import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { normalize, rule } from './helpers.mjs';

/** @param {string} p */
const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');
const [badge, popover, menu, fontScale, themePicker, readme, showcase] = await Promise.all([
	read('../src/lib/components/atoms/Badge.svelte'),
	read('../src/lib/components/molecules/Popover.svelte'),
	read('../src/lib/components/molecules/Menu.svelte'),
	read('../src/lib/components/molecules/FontScalePicker.svelte'),
	read('../src/lib/components/molecules/ThemePicker.svelte'),
	read('../README.md'),
	read('../src/routes/+page.svelte')
]);

test('Badge reads --badge-fs / --badge-fw on the base chip, defaulting to today values', () => {
	const base = rule(badge, '.badge');
	assert.equal(base['font-size'], 'var(--badge-fs, var(--fs-xs))');
	assert.equal(base['font-weight'], 'var(--badge-fw, var(--fw-medium))');
});

test('Badge sm/xs step down through --badge-fs, so setting it wins over the size prop', () => {
	assert.match(
		normalize(badge),
		/\.badge-sm, \.badge-xs \{ font-size: var\(--badge-fs, calc\(var\(--fs-xs\) \* 0\.92\)\);/
	);
});

test('Badge variant typography reads --badge-fw too, keeping its own weight as the fallback', () => {
	assert.equal(rule(badge, '.mono')['font-weight'], 'var(--badge-fw, var(--fw-normal))');
	assert.equal(rule(badge, '.uppercase')['font-weight'], 'var(--badge-fw, var(--fw-semibold))');
});

test('Badge numeric squares off with --badge-min-size, unset keeping 1.5em wide and auto tall', () => {
	const numeric = rule(badge, '.numeric');
	assert.equal(numeric['min-width'], 'var(--badge-min-size, 1.5em)');
	assert.equal(numeric['min-height'], 'var(--badge-min-size, auto)');
	assert.equal(numeric['justify-content'], 'center');
});

test('every --badge-* size hook is read with a fallback, so unset renders exactly as before', () => {
	for (const [prop, fallbacks] of [
		['--badge-fs', ['var(--fs-xs)', 'calc(var(--fs-xs) * 0.92)']],
		['--badge-fw', ['var(--fw-medium)', 'var(--fw-normal)', 'var(--fw-semibold)']],
		['--badge-min-size', ['1.5em', 'auto']]
	]) {
		const reads = [...normalize(badge).matchAll(new RegExp(`var\\(${prop}([^)]*\\)*?)`, 'g'))];
		assert.ok(reads.length > 0, `${prop} is never read`);
		for (const [, tail] of reads) {
			assert.ok(tail.startsWith(', '), `${prop} is read without a fallback`);
		}
		for (const fb of fallbacks) {
			assert.ok(normalize(badge).includes(`var(${prop}, ${fb})`), `${prop} lost its ${fb} default`);
		}
	}
});

test('Badge publishes the size axis in the README table', () => {
	const row = readme.match(/\| `Badge` \|([^\n]*)\|/)?.[1] ?? '';
	for (const prop of ['--badge-fs', '--badge-fw', '--badge-min-size']) assert.ok(row.includes(prop), prop);
});

test('the showcase builds a square count chip from numeric + the size hooks', () => {
	assert.match(
		normalize(showcase),
		/<Badge numeric size="sm" tone="info" style="--badge-min-size: 1\.5rem; --badge-fs: var\(--fs-sm\); --badge-fw: var\(--fw-semibold\)">/
	);
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
	assert.equal(rule(popover, '.pop-trigger.trigger-pill')['border-radius'], 'var(--pop-trigger-radius, var(--r-pill))');
});

test('the pill rule outranks the zero-specificity default radius, so it composes with every chrome prop', () => {
	assert.match(normalize(popover), /:where\(\.pop-trigger:not\(\.bare\)\) \{[^}]*border-radius: var\(--pop-trigger-radius, var\(--r-md\)\);/);
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

test('the default trigger reads every paint axis, defaulting to the values it draws today', () => {
	const base = normalize(popover).match(/:where\(\.pop-trigger:not\(\.bare\)\) \{([^}]*)\}/)?.[1] ?? '';
	assert.match(base, /border: 1px solid var\(--pop-trigger-border, transparent\);/);
	assert.match(base, /background: var\(--pop-trigger-bg, transparent\);/);
	assert.match(base, /color: var\(--pop-trigger-fg, var\(--text\)\);/);
	assert.match(base, /font-size: var\(--pop-trigger-size, inherit\);/);
});

test('the canonical and variant triggers read the same hooks, each keeping its own value as the fallback', () => {
	const canonical = rule(popover, '.pop-trigger.canonical');
	assert.equal(canonical.background, 'var(--pop-trigger-bg, var(--surface))');
	assert.equal(canonical['border-color'], 'var(--pop-trigger-border, var(--border-strong))');
	assert.equal(canonical['font-size'], 'var(--pop-trigger-size, var(--fs-sm))');

	const primary = rule(popover, '.pop-trigger.trigger-primary');
	assert.equal(primary.background, 'var(--pop-trigger-bg, var(--accent))');
	assert.equal(primary.color, 'var(--pop-trigger-fg, var(--text-on-accent))');

	assert.equal(rule(popover, '.pop-trigger.trigger-sm')['font-size'], 'var(--pop-trigger-size, var(--fs-xs))');
	assert.equal(rule(popover, '.pop-trigger.trigger-lg')['font-size'], 'var(--pop-trigger-size, var(--fs-base))');
	assert.equal(rule(popover, '.pop-trigger.trigger-danger').color, 'var(--pop-trigger-fg, var(--danger))');
});

test('a bare trigger still takes bg/fg/radius/size, keeping its stripped defaults', () => {
	const bare = normalize(popover).match(/:where\(\.pop-trigger\.bare\) \{([^}]*)\}/)?.[1] ?? '';
	assert.match(bare, /border-radius: var\(--pop-trigger-radius, 0\);/);
	assert.match(bare, /background: var\(--pop-trigger-bg, none\);/);
	assert.match(bare, /color: var\(--pop-trigger-fg, inherit\);/);
	assert.match(bare, /font: inherit; font-size: var\(--pop-trigger-size, inherit\);/);
	assert.match(bare, /border: 0;/);
});

test('every --pop-trigger-* hook is read with a fallback, so unset triggers are byte-identical', () => {
	for (const [, tail] of normalize(popover).matchAll(/var\(--pop-trigger-(?:bg|fg|border|radius|size|pad)([^)]*\)*?)/g)) {
		assert.ok(tail.startsWith(', '), 'a --pop-trigger-* hook is read without a fallback');
	}
});

test('Popover is in the README property table with its trigger hooks and --pop-box', () => {
	const row = readme.match(/\| `Popover` \|([^\n]*)\|/)?.[1];
	assert.ok(row, 'Popover is missing from the published-properties table');
	for (const prop of [
		'--pop-trigger-bg',
		'--pop-trigger-fg',
		'--pop-trigger-border',
		'--pop-trigger-radius',
		'--pop-trigger-size',
		'--pop-trigger-pad',
		'--pop-box'
	])
		assert.ok(row.includes(prop), prop);
});

test('--pop-trigger-pad reads on every padding tier, each keeping its own value', () => {
	for (const [selector, fallback] of [
		[':where(.pop-trigger:not(.bare))', 'var(--sp-1)'],
		['.pop-trigger.canonical', 'var(--sp-2) var(--sp-4)'],
		['.pop-trigger.trigger-sm', 'var(--sp-1) var(--sp-3)'],
		['.pop-trigger.trigger-lg', 'var(--sp-3) var(--sp-5)'],
		['.pop-trigger.trigger-control', '0 var(--sp-3)'],
		['.pop-trigger.trigger-box', '0'],
		[':where(.pop-trigger.bare)', '0']
	]) {
		assert.equal(rule(popover, selector).padding, `var(--pop-trigger-pad, ${fallback})`, selector);
	}
});

test('a Toggle-shaped trigger needs no canonical chrome: pill + --pop-box: auto + the paint hooks', () => {
	const sized = normalize(popover).match(/:where\(\.pop-trigger:not\(\.bare\)\) \{([^}]*)\}/)?.[1] ?? '';
	assert.match(sized, /display: inline-flex;/);
	assert.match(sized, /min-height: var\(--pop-box, var\(--box-sm\)\);/);
	assert.match(sized, /min-width: var\(--pop-box, var\(--box-sm\)\);/);
	assert.equal(rule(popover, ':where(.pop-trigger:not(.bare))')['line-height'], undefined);
	assert.equal(rule(popover, ':where(.pop-trigger:not(.bare))').height, undefined);
});

test('the showcase sits a pill trigger in a row of Toggles', () => {
	assert.match(normalize(showcase), /<Toggle pill pressed=\{toggleA\}[\s\S]*?<Popover label="Filters" pill style="--pop-box: auto;/);
});

test('triggerClass no longer claims a consumer scoped stylesheet reaches the trigger', () => {
	assert.doesNotMatch(popover, /no :global needed/);
	assert.doesNotMatch(readme, /no `?:global`? needed/);
	assert.match(normalize(popover), /scoped\* CSS cannot reach it/);
	assert.match(normalize(readme), /Your component's \*scoped\* CSS cannot reach it/);
});
