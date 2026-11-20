import assert from 'node:assert/strict';
import { dirname } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';

const HERE = dirname(fileURLToPath(import.meta.url));

const bundled = await esbuild.build({
	stdin: {
		contents: `import { render } from 'svelte/server';
import Progress from '../src/lib/components/atoms/Progress.svelte';
import CapBar from '../src/lib/components/molecules/CapBar.svelte';
import GlyphStack from '../src/lib/components/molecules/GlyphStack.svelte';
import Popover from '../src/lib/components/molecules/Popover.svelte';
import { createRawSnippet } from 'svelte';
export { render, Progress, CapBar, GlyphStack, Popover, createRawSnippet };`,
		resolveDir: HERE,
		loader: 'js'
	},
	bundle: true,
	write: false,
	format: 'esm',
	platform: 'node',
	conditions: ['svelte', 'import'],
	define: { 'import.meta.env.DEV': 'false' },
	alias: { $lib: `${HERE}/../src/lib` },
	plugins: [sveltePlugin({ compilerOptions: { generate: 'server', css: 'injected' } })]
});
const { render, Progress, CapBar, GlyphStack, Popover, createRawSnippet } = await import(
	`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
);

/** @param {any} component @param {Record<string, unknown>} props @param {string} root */
const rootClasses = (component, props, root) => {
	const { body } = render(component, { props });
	const tag = body.match(/<[a-z]+[^>]*\bclass="([^"]*)"[^>]*>/g)?.find((/** @type {string} */ t) => new RegExp(`class="${root}[ "]`).test(t));
	assert.ok(tag, `no .${root} element in ${body}`);
	return /** @type {RegExpMatchArray} */ (tag.match(/class="([^"]*)"/))[1].split(/\s+/).filter(Boolean);
};

test('prerendered GlyphStack carries `stacked` only when it stacks', () => {
	const items = [{ inline: 'a' }, { inline: 'b' }];
	assert.ok(!rootClasses(GlyphStack, { items, stack: 'never' }, 'glyph-stack').includes('stacked'));
	assert.ok(rootClasses(GlyphStack, { items, stack: 'always' }, 'glyph-stack').includes('stacked'));
});

test('prerendered CapBar carries only the state classes that hold', () => {
	const row = rootClasses(CapBar, { label: 'CPU', value: 20, cap: 50 }, 'cap-bar');
	for (const flag of ['readonly', 'dragging', 'keying', 'stacked', 'uncapped']) {
		assert.ok(!row.includes(flag), `unexpected ${flag} in ${row.join(' ')}`);
	}
	const set = rootClasses(CapBar, { label: 'CPU', value: 20, cap: null, readonly: true, layout: 'stacked' }, 'cap-bar');
	for (const flag of ['readonly', 'stacked', 'uncapped']) {
		assert.ok(set.includes(flag), `missing ${flag} in ${set.join(' ')}`);
	}
	for (const flag of ['dragging', 'keying']) assert.ok(!set.includes(flag), `unexpected ${flag}`);
});

test('prerendered Progress carries only the flag classes that hold', () => {
	const plain = rootClasses(Progress, { value: 40 }, 'progress');
	for (const flag of ['indeterminate', 'gradient', 'striped', 'grow', 'block', 'colored']) {
		assert.ok(!plain.includes(flag), `unexpected ${flag} in ${plain.join(' ')}`);
	}
	const set = rootClasses(Progress, { gradient: true, striped: true }, 'progress');
	for (const flag of ['indeterminate', 'gradient', 'striped']) {
		assert.ok(set.includes(flag), `missing ${flag} in ${set.join(' ')}`);
	}
});

test('prerendered Popover trigger carries `counted` only with a count', () => {
	const trigger = createRawSnippet(() => ({ render: () => '<span>Menu</span>' }));
	const plain = rootClasses(Popover, { label: 'Menu', trigger }, 'pop-trigger');
	assert.ok(!plain.includes('counted'), `unexpected counted in ${plain.join(' ')}`);
	assert.ok(rootClasses(Popover, { label: 'Menu', trigger, count: 3 }, 'pop-trigger').includes('counted'));
});
