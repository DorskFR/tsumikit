import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [button, popover, variables] = await Promise.all([
	readFile(new URL('../src/lib/components/atoms/Button.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/components/molecules/Popover.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/styles/variables.css', import.meta.url), 'utf8')
]);

test('Button and Popover expose the same success tone and semantic color', () => {
	assert.match(button, /tone\?:[^;]*'success'/);
	assert.match(popover, /type TriggerTone =[^;]*'success'/);
	assert.match(button, /class:btn-tone-success={tone === 'success'}/);
	assert.match(popover, /class:trigger-tone-success={tone === 'success'}/);
	assert.match(button, /\.btn-tone-success\s*{\s*--btn-tone: var\(--ok\);/);
	assert.match(
		popover,
		/\.pop-trigger\.trigger-tone-success\s*{\s*--pop-trigger-tone: var\(--ok\);/
	);
	assert.match(variables, /--text-on-success: var\(--bg\);/);
});

test('neutral success controls share tinted border and hover treatments', () => {
	assert.match(
		button,
		/\.btn-tone-success,[\s\S]*color: var\(--btn-tone\);[\s\S]*border-color: color-mix\(in srgb, var\(--btn-tone\) 50%, var\(--border\)\);/
	);
	assert.match(
		button,
		/\.btn-tone-success:hover:not\(:disabled\),[\s\S]*background: color-mix\(in srgb, var\(--btn-tone\) 14%, transparent\);/
	);
	assert.match(
		popover,
		/\.pop-trigger\.trigger-tone-success,[\s\S]*color: var\(--pop-trigger-tone\);[\s\S]*border-color: color-mix\(in srgb, var\(--pop-trigger-tone\) 50%, var\(--border\)\);/
	);
	assert.match(
		popover,
		/\.pop-trigger\.trigger-tone-success:hover:not\(:disabled\),[\s\S]*background: color-mix\(in srgb, var\(--pop-trigger-tone\) 14%, transparent\);/
	);
	assert.match(
		button,
		/\.btn-control\.btn-tone-success\s*{\s*color: var\(--ok\);\s*border-color: color-mix\(in srgb, var\(--ok\) 50%, var\(--border\)\);/
	);
});

test('primary success controls share filled success chrome and disabled-safe hover', () => {
	for (const [source, selector] of [
		[button, String.raw`\.btn-primary\.btn-tone-success`],
		[popover, String.raw`\.pop-trigger\.trigger-primary\.trigger-tone-success`]
	]) {
		assert.match(
			source,
			new RegExp(
				`${selector}\\s*\\{\\s*background: var\\(--ok\\);\\s*border-color: var\\(--ok\\);\\s*color: var\\(--text-on-success\\);`
			)
		);
		assert.match(
			source,
			new RegExp(
				`${selector}:hover:not\\(:disabled\\)\\s*\\{\\s*background: var\\(--ok\\);\\s*border-color: var\\(--ok\\);\\s*filter: brightness\\(1\\.08\\);`
			)
		);
	}
	assert.match(button, /\.btn:disabled\s*{[\s\S]*opacity: 0\.45;[\s\S]*cursor: not-allowed;/);
	assert.match(
		popover,
		/\.pop-trigger:disabled\s*{[\s\S]*opacity: 0\.45;[\s\S]*cursor: not-allowed;/
	);
});
