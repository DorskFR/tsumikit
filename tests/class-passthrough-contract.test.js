import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../src/lib/components/', import.meta.url);
const files = (await readdir(root, { recursive: true })).filter((f) => f.endsWith('.svelte'));

test('every component accepts class and style', async () => {
	for (const f of files) {
		const src = await readFile(new URL(f, root), 'utf8');
		const hasClass = /class\?: string|class: klass|\[key: string\]: unknown|HTML\w*Attributes/.test(src);
		assert.ok(hasClass, `${f} has no class passthrough`);
	}
});

const STYLED = [
	'atoms/Icon.svelte',
	'atoms/Scrim.svelte',
	'atoms/Spinner.svelte',
	'layouts/AppShell.svelte',
	'layouts/NavItem.svelte',
	'layouts/NavSection.svelte',
	'layouts/ResizablePanel.svelte',
	'molecules/Breadcrumb.svelte',
	'molecules/ConfirmModal.svelte',
	'molecules/Dropzone.svelte',
	'molecules/FilterInput.svelte',
	'molecules/Menu.svelte',
	'molecules/Modal.svelte',
	'molecules/Popover.svelte',
	'molecules/Tabs.svelte',
	'molecules/Timestamp.svelte',
	'molecules/Toaster.svelte',
	'molecules/Tooltip.svelte',
	'molecules/Truncate.svelte',
	'organisms/DataTable.svelte',
	'organisms/FilterSearchBar.svelte'
];

test('the formerly closed components accept style too', async () => {
	for (const f of STYLED) {
		const src = await readFile(new URL(f, root), 'utf8');
		assert.match(src, /style\?: string/, `${f} has no style passthrough`);
	}
});

test('secondary roots get named class props', async () => {
	const read = (/** @type {string} */ p) => readFile(new URL(p, root), 'utf8');
	assert.match(await read('molecules/Popover.svelte'), /panelClass\?: string/);
	assert.match(await read('molecules/Modal.svelte'), /bodyClass\?: string/);
	assert.match(await read('molecules/Tabs.svelte'), /panelClass\?: string/);
	assert.match(await read('organisms/DataTable.svelte'), /tableClass\?: string/);
	assert.match(await read('molecules/Menu.svelte'), /panelClass\?: string/);
});
