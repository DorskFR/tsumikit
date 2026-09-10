import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const componentsDir = new URL('../src/lib/components/', import.meta.url);

const files = new Map();
for (const group of await readdir(componentsDir)) {
	const dir = new URL(`${group}/`, componentsDir);
	for (const entry of await readdir(dir)) {
		if (entry.endsWith('.svelte')) files.set(entry.slice(0, -'.svelte'.length), new URL(entry, dir));
	}
}

const table = readme.match(/\| component \| published properties \|\n\|[^\n]*\|\n((?:\|[^\n]*\|\n)+)/);

test('the README publishes a custom-property table', () => {
	assert.ok(table, 'README is missing the published-properties table');
});

const rows = (table?.[1] ?? '')
	.trim()
	.split('\n')
	.map((line) => {
		const [, name, props] = line.split('|').map((cell) => cell.trim());
		return { name: name.replaceAll('`', ''), props: props.split(',').map((p) => p.trim().replaceAll('`', '')) };
	});

test('every documented property is named --<prefix>-<axis>', () => {
	for (const { name, props } of rows) {
		for (const prop of props) {
			assert.match(prop, /^--[a-z][a-z0-9]*(-[a-z0-9]+)+$/, `${name}: ${prop}`);
		}
	}
});

test('every documented property is read by its component', async () => {
	for (const { name, props } of rows) {
		const url = files.get(name);
		assert.ok(url, `no component file for ${name}`);
		const source = await readFile(url, 'utf8');
		for (const prop of props) {
			assert.ok(source.includes(`var(${prop},`) || source.includes(`var(${prop})`), `${name} never reads ${prop}`);
		}
	}
});

test('every documented property has a default, so leaving it unset changes nothing', async () => {
	for (const { name, props } of rows) {
		const source = await readFile(files.get(name), 'utf8');
		for (const prop of props) {
			const defaulted =
				source.includes(`var(${prop},`) ||
				new RegExp(`${prop}\\s*:`).test(source) ||
				source.includes(`style:${prop}=`);
			assert.ok(defaulted, `${name}: ${prop} is read without a fallback and never defaulted`);
		}
	}
});

test('the gap-filled controls cover bg/fg/border/size/radius', () => {
	const byName = new Map(rows.map((r) => [r.name, r.props]));
	for (const [name, prefix] of [
		['Button', '--btn'],
		['Select', '--select'],
		['Input', '--input'],
		['Textarea', '--textarea']
	]) {
		for (const axis of ['bg', 'fg', 'border', 'size', 'radius']) {
			assert.ok(byName.get(name)?.includes(`${prefix}-${axis}`), `${name} is missing ${prefix}-${axis}`);
		}
	}
	for (const axis of ['bg', 'fg', 'border', 'radius']) {
		assert.ok(byName.get('Badge')?.includes(`--badge-${axis}`), `Badge is missing --badge-${axis}`);
	}
	assert.deepEqual(byName.get('Text'), ['--txt-fg', '--txt-size']);
});

test('README states that reaching into internals with :global() is unsupported', () => {
	assert.match(readme, /`:global\(\)` into kit internals is unsupported/);
	assert.match(readme, /private and change without a major/);
});
