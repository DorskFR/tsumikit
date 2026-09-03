import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} p */
const read = (p) => readFile(new URL(`../src/${p}`, import.meta.url), 'utf8');
const [ctx, index, field, input, select, textarea, checkbox, sw, slider, filterInput] =
	await Promise.all([
		read('lib/field-context.ts'),
		read('lib/index.ts'),
		read('lib/components/molecules/Field.svelte'),
		read('lib/components/atoms/Input.svelte'),
		read('lib/components/atoms/Select.svelte'),
		read('lib/components/atoms/Textarea.svelte'),
		read('lib/components/atoms/Checkbox.svelte'),
		read('lib/components/atoms/Switch.svelte'),
		read('lib/components/atoms/Slider.svelte'),
		read('lib/components/molecules/FilterInput.svelte')
	]);

test('field-context exports the key, type and helpers', () => {
	assert.match(ctx, /export const FIELD_KEY = Symbol\('tsu-field'\)/);
	assert.match(ctx, /export type FieldContext = {\s*id: string;\s*describedBy\?: string;\s*invalid: boolean;\s*}/);
	assert.match(ctx, /export function setFieldContext\(ctx: FieldContext\)/);
	assert.match(ctx, /export function getFieldContext\(\): FieldContext \| undefined/);
	assert.match(ctx, /export function warnUnlabelled\(el: HTMLElement \| null \| undefined, name: string\)/);
});

test('warnUnlabelled is dev-only, SSR-safe and warns once per element', () => {
	assert.match(ctx, /import\.meta\.env\.DEV/);
	assert.match(ctx, /typeof document === 'undefined'/);
	assert.match(ctx, /new WeakSet<Element>\(\)/);
	assert.match(ctx, /el\.closest\('label'\)/);
	assert.match(ctx, /aria-labelledby/);
	assert.match(ctx, /label\[for="\$\{CSS\.escape\(id\)\}"\]/);
	assert.match(ctx, /rendered without an accessible label/);
});

test('index exports the field-context helpers', () => {
	assert.match(index, /FIELD_KEY,\s*type FieldContext,\s*getFieldContext,\s*setFieldContext,\s*warnUnlabelled,?\s*} from '\.\/field-context'/);
});

test('Field generates an id, publishes context and ids its hint/error', () => {
	assert.match(field, /const uid = \$props\.id\(\)/);
	assert.match(field, /const forId = \$derived\(forProp \?\? uid\)/);
	assert.match(field, /const hintId = \$derived\(`\$\{forId\}-hint`\)/);
	assert.match(field, /const errorId = \$derived\(`\$\{forId\}-err`\)/);
	assert.match(field, /setFieldContext\({\s*get id\(\) {\s*return forId;\s*},\s*get describedBy\(\) {\s*return describedBy;\s*},\s*get invalid\(\) {\s*return !!error;\s*}\s*}\)/);
	assert.match(field, /<label class="label" for={forId} style:width={labelWidth}>/);
	assert.match(field, /<span class="hint" id={hintId}>/);
	assert.match(field, /<span class="error" id={errorId}>/);
	assert.doesNotMatch(field, /<span class="label"/);
});

const controls = {
	Input: input,
	Select: select,
	Textarea: textarea,
	Checkbox: checkbox,
	Switch: sw,
	Slider: slider,
	FilterInput: filterInput
};

for (const [name, src] of Object.entries(controls)) {
	test(`${name} reads field context and defaults id / aria-describedby / aria-invalid`, () => {
		assert.match(src, /const field = getFieldContext\(\)/);
		assert.match(src, /'aria-describedby': ariaDescribedby,/);
		assert.match(src, /'aria-invalid': ariaInvalid,/);
		assert.match(src, /aria-describedby={ariaDescribedby \?\? field\?\.describedBy}/);
		if (name === 'Slider') {
			assert.match(src, /const id = \$derived\(idProp \?\? field\?\.id \?\? fallbackId\)/);
		} else {
			assert.match(src, /id={id \?\? field\?\.id}/);
		}
		if (name === 'FilterInput') {
			assert.match(src, /aria-invalid={ariaInvalid \?\? \(field\?\.invalid \? 'true' : undefined\)}/);
		} else {
			assert.match(src, /const isInvalid = \$derived\(invalid \|\| !!field\?\.invalid\)/);
			assert.match(src, /aria-invalid={ariaInvalid \?\? \(isInvalid \? 'true' : undefined\)}/);
		}
	});
}

test('controls that bind their element warn in dev when unlabelled', () => {
	for (const [name, src] of Object.entries(controls)) {
		if (name === 'Checkbox' || name === 'Switch') continue;
		assert.match(src, new RegExp(`\\$effect\\(\\(\\) => warnUnlabelled\\(el, '${name}'\\)\\)`));
	}
});
