import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [button, popover, variables] = await Promise.all([
	readFile(new URL('../src/lib/components/atoms/Button.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/components/molecules/Popover.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/styles/tokens.css', import.meta.url), 'utf8')
]);

test('Button and Popover expose the same success tone and semantic color', () => {
	assert.match(button, /tone\?: Tone \| 'none'/);
	assert.match(popover, /type TriggerTone =[^;]*'success'/);
	assert.match(button, /class:btn-tone-success={t === 'ok'}/);
	assert.match(popover, /class:trigger-tone-success={tone === 'success'}/);
	assert.match(button, /\.btn-tone-success\s*{\s*color: var\(--ok\);/);
	assert.match(popover, /\.pop-trigger\.trigger-tone-success\s*{\s*color: var\(--ok\);/);
	assert.match(variables, /--text-on-success: var\(--bg\);/);
});

test('neutral success controls share tinted border and hover treatments', () => {
	assert.match(
		button,
		/\n\t\.btn-tone-success\s*{\s*color: var\(--ok\);\s*border-color: color-mix\(in srgb, var\(--ok\) 50%, var\(--border\)\);/
	);
	assert.match(
		button,
		/\n\t\t\.btn-tone-success:hover:not\(:disabled\)\s*{\s*background: color-mix\(in srgb, var\(--ok\) 14%, transparent\);\s*border-color: var\(--ok\);/
	);
	assert.match(
		popover,
		/\.pop-trigger\.trigger-tone-success\s*{\s*color: var\(--ok\);\s*border-color: color-mix\(in srgb, var\(--ok\) 50%, var\(--border\)\);/
	);
	assert.match(
		popover,
		/\.pop-trigger\.trigger-tone-success:hover:not\(:disabled\)\s*{\s*background: color-mix\(in srgb, var\(--ok\) 14%, transparent\);\s*border-color: var\(--ok\);/
	);
	assert.match(
		button,
		/\.btn-control\.btn-tone-success\s*{\s*color: var\(--ok\);\s*border-color: color-mix\(in srgb, var\(--ok\) 50%, var\(--border\)\);/
	);
});

test('primary success controls share filled success chrome and disabled-safe hover', () => {
	for (const [source, selector, bg, border, fg] of [
		[button, String.raw`\.btn-primary\.btn-tone-success`, 'var\\(--ok\\)', 'var\\(--ok\\)', 'var\\(--text-on-success\\)'],
		[
			popover,
			String.raw`\.pop-trigger\.trigger-primary\.trigger-tone-success`,
			'var\\(--ok\\)',
			'var\\(--ok\\)',
			'var\\(--text-on-success\\)'
		]
	]) {
		assert.match(
			source,
			new RegExp(`${selector}\\s*\\{\\s*background: ${bg};\\s*border-color: ${border};\\s*color: ${fg};`)
		);
		assert.match(
			source,
			new RegExp(
				`${selector}:hover:not\\(:disabled\\)\\s*\\{\\s*background: var\\(--ok\\);\\s*border-color: var\\(--ok\\);\\s*filter: brightness\\(1\\.08\\);`
			)
		);
	}
	assert.match(button, /\.btn:disabled\s*{[\s\S]*opacity: var\(--disabled-opacity\);[\s\S]*cursor: not-allowed;/);
	assert.match(
		popover,
		/\.pop-trigger:disabled,\s*\.pop-trigger\.is-disabled\s*{[\s\S]*opacity: var\(--disabled-opacity\);[\s\S]*cursor: not-allowed;/
	);
});
