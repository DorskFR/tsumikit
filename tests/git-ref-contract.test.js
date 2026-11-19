import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const src = await readFile(
	new URL('../src/lib/components/molecules/GitRef.svelte', import.meta.url),
	'utf8'
);
const css = src.slice(src.indexOf('<style>'));

test('GitRef renders nothing when every part is absent', () => {
	assert.match(src, /\{#if branch \|\| pr \|\| diff\}/);
	assert.match(src, /branch\?: string;/);
	assert.match(src, /pr\?: PullRequest;/);
	assert.match(src, /diff\?: DiffStats;/);
});

test('GitRef row is inline-flex with --sp-1 gap and mono type', () => {
	assert.match(css, /\.git-ref \{\s*display: inline-flex;\s*align-items: center;\s*gap: var\(--sp-1\);/);
	assert.match(css, /font-family: var\(--font-mono\);/);
});

test('branch chip shows the fork icon, truncates and carries the full name as title', () => {
	assert.match(src, /<span class="chip branch" style:max-width=\{maxWidth\} title=\{branch\}>/);
	assert.match(src, /<Icon name="fork" label="Branch" \/>/);
	assert.match(src, /<span class="text">\{branch\}<\/span>/);
	assert.match(src, /maxWidth = '14rem'/);
	assert.match(css, /\.branch \{\s*max-width: 14rem;/);
	assert.doesNotMatch(src, /--git-ref-/);
	assert.match(css, /\.text \{\s*min-width: 0;\s*overflow: hidden;\s*text-overflow: ellipsis;/);
});

test('PR chip is a new-tab noopener link labelled owner/repo#N with #N fallback', () => {
	assert.match(src, /href=\{pr\.url\}\s*target="_blank"\s*rel="noopener noreferrer"/);
	assert.match(
		src,
		/return pr\.owner && pr\.repo \? `\$\{pr\.owner\}\/\$\{pr\.repo\}#\$\{pr\.number\}` : `#\$\{pr\.number\}`;/
	);
	assert.match(src, /<Icon label="Pull request">\{@render pullRequestGlyph\(\)\}<\/Icon>/);
});

test('PR state maps onto the shared Tone vocabulary', () => {
	assert.match(src, /import type \{ Tone \} from '\$lib\/tone'/);
	assert.match(src, /export type PrState = 'open' \| 'merged' \| 'closed' \| 'draft'/);
	assert.match(src, /PR_TONE: Record<PrState, Tone> = \{\s*open: 'ok',\s*merged: 'accent',\s*closed: 'danger',\s*draft: 'neutral',/);
	assert.match(src, /const prTone = \$derived\(pr \? PR_TONE\[pr\.state \?\? 'open'\] : undefined\);/);
	assert.match(src, /class="chip pr tone-\{prTone\}"/);
	for (const [tone, token] of [['ok', '--ok'], ['accent', '--accent'], ['danger', '--danger'], ['neutral', '--text-muted']]) {
		assert.ok(
			css.includes(
				`.pr.tone-${tone} {\n\t\tcolor: var(${token});\n\t\tborder-color: color-mix(in srgb, var(${token}) 40%, transparent);\n\t\tbackground: color-mix(in srgb, var(${token}) 12%, transparent);`
			),
			tone
		);
		assert.ok(css.includes(`.pr.tone-${tone}:hover {\n\t\t\tborder-color: var(${token});`), tone);
	}
	assert.match(css, /\.pr:focus-visible \{\s*outline: var\(--focus-ring-width\) solid currentColor;/);
});

test('diff stats colour additions --ok and deletions --danger with tabular digits', () => {
	assert.match(src, /<span class="add">\+\{diff\.additions\}<\/span>/);
	assert.match(src, /<span class="del">−\{diff\.deletions\}<\/span>/);
	assert.match(css, /\.diff \{[^}]*font-variant-numeric: tabular-nums;/);
	assert.match(css, /\.add \{\s*color: var\(--ok\);/);
	assert.match(css, /\.del \{\s*color: var\(--danger\);/);
});

test('collapse: glyph always hides text, auto hides it below 18rem of the container', () => {
	assert.match(src, /collapse = 'auto'/);
	assert.match(src, /collapse\?: 'auto' \| 'never' \| 'glyph';/);
	assert.match(src, /class="git-ref collapse-\{collapse\} \{klass\}"/);
	assert.match(css, /\.collapse-glyph \.text \{\s*display: none;/);
	assert.match(css, /@container \(max-width: 18rem\) \{\s*\.collapse-auto \.text \{\s*display: none;/);
	assert.doesNotMatch(css, /:global/);
});
