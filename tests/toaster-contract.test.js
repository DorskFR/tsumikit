import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [component, store, index] = await Promise.all([
	readFile(new URL('../src/lib/components/molecules/Toaster.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/stores/toast.svelte.ts', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8')
]);

test('Toaster, store and types are exported from the package index', () => {
	assert.match(index, /export { default as Toaster } from '\.\/components\/molecules\/Toaster\.svelte';/);
	for (const name of ['Toast', 'ToastAction', 'ToastOptions', 'ToastTone', 'ToastToneInput']) {
		assert.match(index, new RegExp(`type ${name},`), `${name} exported`);
	}
	assert.match(index, /toasts,?\s*} from '\.\/stores\/toast\.svelte';/);
});

test('store: tones include info, danger aliases error, action + pending on Toast', () => {
	assert.match(store, /export type ToastTone = 'neutral' \| 'ok' \| 'error' \| 'info';/);
	assert.match(store, /export type ToastToneInput = ToastTone \| 'danger';/);
	assert.match(store, /opts\.tone === 'danger' \? 'error' : \(opts\.tone \?\? 'neutral'\)/);
	assert.match(store, /run: \(\) => void \| Promise<void>;/);
	assert.match(store, /action\?: ToastAction;\n\s+\/\*\*[^\n]*\*\/\n\s+pending: boolean;/);
});

test('store: show/ok/error/info signatures stay backward compatible', () => {
	assert.match(store, /show\(message: string, opts: ToastOptions = {}\): number/);
	assert.match(store, /ok\(message: string, duration\?: number, action\?: ToastAction\)/);
	assert.match(store, /error\(message: string, duration\?: number, action\?: ToastAction\)/);
	assert.match(store, /info\(message: string, duration\?: number, action\?: ToastAction\)/);
	assert.match(store, /export const TOAST_MS = 4000;/);
});

test('store: action toasts linger longer and act() dismisses once run settles', () => {
	assert.match(store, /export const ACTION_TOAST_MS = 7000;/);
	assert.match(store, /opts\.duration \?\? \(opts\.action \? ACTION_TOAST_MS : TOAST_MS\)/);
	assert.match(store, /async act\(id: number\)/);
	assert.match(store, /if \(!t\?\.action \|\| t\.pending\) return;/);
	assert.match(store, /await t\.action\.run\(\);[\s\S]*finally {\s*this\.dismiss\(id\);/);
});

test('renders the stack in a manual popover shown on mount, guarded when unsupported', () => {
	assert.match(component, /popover="manual"/);
	assert.match(component, /typeof el\.showPopover !== 'function'\) return;/);
	assert.match(component, /if \(toasts\.items\.length\) el\.showPopover\(\);\s*else el\.hidePopover\(\);/);
	assert.match(component, /\.toaster:not\(:popover-open\)\s*{\s*display: none;/);
});

test('keeps live-region semantics', () => {
	assert.match(component, /role="status"/);
	assert.match(component, /aria-live="polite"/);
	assert.match(component, /aria-relevant="additions"/);
});

test('toast rows are raised Cards; action is a real ghost sm Button with loading', () => {
	assert.match(component, /<Card\s+as="div"\s+surface="raised"\s+class="toast"/);
	assert.match(component, /<Card\s+as="button"\s+surface="raised"\s+class="toast"/);
	assert.match(component, /<Button size="sm" variant="ghost" loading={t\.pending} onclick={\(\) => toasts\.act\(t\.id\)}>/);
	assert.match(component, /<button type="button" class="toast-text" onclick={\(\) => toasts\.dismiss\(t\.id\)}>/);
});

test('sizing token --toast-max-width defaults to 28rem, no z-index needed in the top layer', () => {
	assert.match(component, /max-width: var\(--toast-max-width, 28rem\);/);
	assert.match(component, /\.toaster\s*{[^}]*position: fixed;/);
});
