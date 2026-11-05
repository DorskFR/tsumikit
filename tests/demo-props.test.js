import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { OUTPUT, generate, serialize } from '../scripts/gen-demo-props.mjs';
import { kebab } from '../src/demo/framework/snippet';

const generated = generate();
const committed = JSON.parse(await readFile(OUTPUT, 'utf8'));

/** @param {string} component @param {string} prop */
const row = (component, prop) => {
	const found = generated[component]?.props.find((p) => p.name === prop);
	assert.ok(found, `${component}.${prop} missing`);
	return found;
};

test('src/demo/props.generated.json is up to date (run `npm run demo:props`)', () => {
	assert.equal(serialize(committed), serialize(generated));
});

test('every component under src/lib/components has a non-empty props entry', async () => {
	const index = await readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8');
	const exported = [...index.matchAll(/components\/(atoms|molecules|organisms|layouts)\/([A-Z]\w*)\.svelte'/g)];
	assert.ok(exported.length >= 98);
	for (const [, family, name] of exported) {
		assert.equal(generated[name]?.family, family, name);
		assert.ok(generated[name].props.length > 0, `${name} has no props`);
	}
});

test('entries resolve to demo sections by family and kebab id', () => {
	const ids = new Set(Object.entries(generated).map(([n, e]) => `${e.family}/${kebab(n)}`));
	assert.ok(ids.has('atoms/button'));
	assert.ok(ids.has('layouts/app-shell'));
	assert.ok(ids.has('organisms/data-table'));
	assert.equal(ids.size, Object.keys(generated).length);
});

test('own members of `type X = HTMLAttributes & {...}` are kept, inherited ones skipped', () => {
	const names = generated.Button.props.map((p) => p.name);
	assert.deepEqual(names.slice(0, 3), ['variant', 'tone', 'size']);
	assert.ok(names.includes('class'));
	assert.ok(names.includes('href'));
	assert.ok(!names.includes('disabled'));
	assert.ok(!names.includes('onclick'));
	assert.ok(!names.includes('aria-label'));
	assert.deepEqual(row('Button', 'loading'), {
		name: 'loading',
		type: "boolean | 'done'",
		optional: true,
		default: 'false',
		description: row('Button', 'loading').description,
	});
	assert.match(row('Button', 'loading').description ?? '', /^Async\/busy state: shows a spinner/);
});

test('`Omit<..., keyof Own> & Own` and `Props` aliases: defaults, JSDoc, bindable', () => {
	assert.equal(row('Badge', 'tone').default, "'neutral'");
	assert.equal(row('Badge', 'grow').description, 'Fill the free space of a flex row (`flex: 1 1 0`).');
	assert.equal(row('Badge', 'onremove').type, '(e: MouseEvent) => void');
	assert.ok(!generated.Badge.props.some((p) => p.name === 'role'));

	assert.equal(row('Select', 'value').bindable, true);
	assert.equal(row('Select', 'value').type, "HTMLSelectAttributes['value']");
	assert.equal(row('Select', 'aria-describedby').description, undefined);
	assert.equal(row('Select', 'width').default, "'full'");
});

test('generic and inline-typed components: required flags and intersections', () => {
	assert.equal(row('DataTable', 'columns').type, 'Column<T>[]');
	assert.equal(row('DataTable', 'columns').optional, false);
	assert.equal(row('DataTable', 'rowKey').type, '(row: T) => string | number');
	assert.equal(row('DataTable', 'empty').default, "'No data.'");

	assert.equal(row('AppShell', 'children').optional, false);
	assert.deepEqual(row('AppShell', 'open'), {
		name: 'open',
		type: 'boolean',
		optional: true,
		default: 'false',
		bindable: true,
		description: 'Mobile drawer state; reset to `false` when the viewport reaches 48rem.',
	});
	assert.equal(row('AppShell', 'layout').type, "'header-top' | 'sidebar-full'");

	assert.ok(generated.Menu.props.some((p) => p.name === 'triggerClass'), 'Pick<ComponentProps<...>> members');
});

test('DemoSection renders the PropsTable under the examples', async () => {
	const section = await readFile(new URL('../src/demo/framework/DemoSection.svelte', import.meta.url), 'utf8');
	assert.match(section, /import PropsTable from '\.\/PropsTable\.svelte'/);
	assert.match(section, /{\/each}\s*<PropsTable \{entry\} \/>/);
	const table = await readFile(new URL('../src/demo/framework/PropsTable.svelte', import.meta.url), 'utf8');
	assert.match(table, /<DataTable[\s\S]*responsive="stack"/);
	assert.match(table, /aria-labelledby="\{entry\.id\}--props"/);
});
