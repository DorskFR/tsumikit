import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const card = await readFile(new URL('../src/lib/components/atoms/Card.svelte', import.meta.url), 'utf8');

test('Card accepts interactive, onclick and maxWidth props', () => {
	assert.match(card, /interactive = false,/);
	assert.match(card, /interactive\?: boolean;/);
	assert.match(card, /onclick\?: \(e: MouseEvent \| KeyboardEvent\) => void;/);
	assert.match(card, /maxWidth\?: string;/);
});

test('interactive non-native cards get role=button and tabindex=0, overridable by rest', () => {
	assert.match(card, /role={interactive && !native \? 'button' : undefined}/);
	assert.match(card, /tabindex={interactive && !native \? 0 : undefined}/);
	assert.match(card, /native = \$derived\(as === 'button' \|\| as === 'a'\)/);
	assert.ok(card.indexOf('role={interactive') < card.indexOf('{...rest}'));
	assert.match(card, /class:card-tap={tap \|\| interactive}/);
});

test('Enter and Space trigger onclick; Space prevents default', () => {
	assert.match(card, /onkeydown={handleKeydown}/);
	assert.match(card, /if \(e\.key !== 'Enter' && e\.key !== ' '\) return;/);
	assert.match(card, /if \(e\.key === ' '\) e\.preventDefault\(\);/);
});

test('clicks and keys from nested interactive elements are ignored', () => {
	assert.match(
		card,
		/'button,a,input,select,textarea,\[role=button\],\[contenteditable\],\[contenteditable=true\]'/
	);
	assert.match(card, /target\?\.closest\?\.\(NESTED\)/);
	assert.match(card, /hit !== e\.currentTarget/);
	assert.match(card, /if \(interactive && fromNested\(e\)\) return;/);
});

test('attention tone adds a class, a left bar and the attention background', () => {
	assert.match(card, /type Tone = SharedTone \| 'attention'/);
	assert.match(card, /class:card-attention={t === 'attention'}/);
	assert.match(card, /\.card-attention\s*{\s*--card-tone: var\(--attention-bar\);/);
	assert.match(card, /box-shadow: inset 3px 0 0 var\(--attention-bar\)/);
	assert.match(card, /background: var\(--attention-bg\)/);
});

test('maxWidth sets an inline max-width and stretches the card', () => {
	assert.match(card, /style:max-width={maxWidth}/);
	assert.match(card, /class:card-max={maxWidth !== undefined}/);
	assert.match(card, /\.card-max\s*{\s*width: 100%;/);
});

test('row mode drops the edge ring, lift, press scale, radius and shadow', () => {
	assert.match(card, /row\?: boolean;/);
	assert.match(card, /row = false,/);
	assert.match(card, /class:card-row={row}/);
	assert.match(card, /{#if lit && !row}<span class="card-fx" aria-hidden="true"><\/span>{\/if}/);
	const rule = card.match(/\.card\.card-row\s*{([^}]*)}/)?.[1] ?? '';
	assert.match(rule, /border-radius: 0;/);
	assert.match(rule, /--card-shadow-rest: none;/);
	assert.match(rule, /translate: none;/);
	assert.match(rule, /scale: none;/);
	assert.ok(card.indexOf('.card.card-row') > card.lastIndexOf('.card-tap:active'), 'row rule overrides hover lift and press scale');
});

test('row mode keeps the pointer-following wash', () => {
	assert.match(card, /\.card-tap:not\(:global\(\[data-fx-card\]:not\(\[data-fx-card='spotlight'\]\)\) \*\)[^{]*{\s*--card-fx: spotlight;\s*background-image: radial-gradient\(/);
	assert.doesNotMatch(card, /\.card-row[^{]*{[^}]*background(-image)?:/);
	assert.match(card, /const lit = \$derived\(tap \|\| interactive\);/);
	assert.match(card, /if \(!node \|\| !lit\) return;/);
});
