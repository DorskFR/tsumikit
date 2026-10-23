import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { escapeHtml, renderMarkdown } from '../src/lib/markdown.ts';

test('raw HTML is escaped, never emitted', () => {
	const out = renderMarkdown('<script>alert(1)</script> <img src=x onerror=alert(1)>');
	assert.doesNotMatch(out, /<script|<img/);
	assert.match(out, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
	assert.equal(escapeHtml('a<b>&"c"'), 'a&lt;b&gt;&amp;&quot;c&quot;');
});

test('links: safe schemes only; javascript:/data: are left as text', () => {
	assert.equal(
		renderMarkdown('[x](https://a.b/c?d=1&e=2)'),
		'<p><a href="https://a.b/c?d=1&amp;e=2" target="_blank" rel="noopener noreferrer">x</a></p>'
	);
	assert.equal(renderMarkdown('[in](/docs#top)'), '<p><a href="/docs#top">in</a></p>');
	for (const bad of ['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,x', 'vbscript:x', '//evil.com']) {
		const out = renderMarkdown(`[x](${bad})`);
		assert.doesNotMatch(out, /<a /, bad);
	}
	assert.doesNotMatch(renderMarkdown('[x](https://a.b/" onclick="1)'), /onclick="/);
});

test('bare URLs autolink with trailing punctuation kept outside, off with autolink:false', () => {
	assert.equal(
		renderMarkdown('see https://x.io/a_(b).'),
		'<p>see <a href="https://x.io/a_(b)" target="_blank" rel="noopener noreferrer">https://x.io/a_(b)</a>.</p>'
	);
	assert.equal(renderMarkdown('see https://x.io', { autolink: false }), '<p>see https://x.io</p>');
	assert.equal(renderMarkdown('`https://x.io`'), '<p><code>https://x.io</code></p>');
});

test('inline: code, strong, em, strikethrough', () => {
	assert.equal(
		renderMarkdown('a `x<y` **b** *c* _d_ ~~e~~ snake_case_name 2*3*4'),
		'<p>a <code>x&lt;y</code> <strong>b</strong> <em>c</em> <em>d</em> <del>e</del> snake_case_name 2*3*4</p>'
	);
});

test('fenced code keeps the body verbatim, escaped, with data-lang; highlight hook wins', () => {
	const src = 'before\n```ts\nconst a = "<b>";\n**not bold**\n```\nafter';
	assert.equal(
		renderMarkdown(src),
		'<p>before</p><pre data-lang="ts"><code>const a = &quot;&lt;b&gt;&quot;;\n**not bold**</code></pre><p>after</p>'
	);
	/** @type {[string, string][]} */
	const calls = [];
	const out = renderMarkdown(src, {
		highlight: (code, lang) => {
			calls.push([code, lang]);
			return `<span class="k">${lang}</span>`;
		}
	});
	assert.deepEqual(calls, [['const a = "<b>";\n**not bold**', 'ts']]);
	assert.match(out, /<pre data-lang="ts"><code><span class="k">ts<\/span><\/code><\/pre>/);
	assert.equal(renderMarkdown('```\nplain\n```', { highlight: () => 'X' }), '<pre><code>plain</code></pre>');
	assert.equal(renderMarkdown('```<x>\ny\n```'), '<pre data-lang="&lt;x&gt;"><code>y</code></pre>');
});

test('headings, paragraphs with soft breaks, blockquote and rule', () => {
	assert.equal(renderMarkdown('# Title\n\nline one\nline two\n\n---\n\n## Sub ##'),
		'<h1>Title</h1><p>line one<br />line two</p><hr /><h2>Sub</h2>');
	assert.equal(renderMarkdown('> quoted **bold**\n> more'), '<blockquote><p>quoted <strong>bold</strong><br />more</p></blockquote>');
});

test('lists: unordered, ordered, continuation lines, back to prose', () => {
	assert.equal(renderMarkdown('- a\n- b\n  more b\n\n1. one\n2) two\ntext'),
		'<ul><li>a</li><li>b<br />more b</li></ul><ol><li>one</li><li>two</li></ol><p>text</p>');
	assert.equal(renderMarkdown('* x\n+ y'), '<ul><li>x</li><li>y</li></ul>');
});

test('GFM tables with alignment and escaped pipes; off with tables:false', () => {
	const src = '| a | b |\n|:--|--:|\n| **1** | x\\|y |\n| <i> | 2 |';
	assert.equal(
		renderMarkdown(src),
		'<table><thead><tr><th style="text-align:left">a</th><th style="text-align:right">b</th></tr></thead>' +
			'<tbody><tr><td style="text-align:left"><strong>1</strong></td><td style="text-align:right">x|y</td></tr>' +
			'<tr><td style="text-align:left">&lt;i&gt;</td><td style="text-align:right">2</td></tr></tbody></table>'
	);
	assert.doesNotMatch(renderMarkdown(src, { tables: false }), /<table/);
});

/** @param {string} tag @param {...string} cells */
const tr = (tag, ...cells) => `<tr>${cells.map((c) => `<${tag}>${c}</${tag}>`).join('')}</tr>`;
/** @param {string[]} head @param {...string[]} rows */
const tbl = (head, ...rows) =>
	`<table><thead>${tr('th', ...head)}</thead><tbody>${rows.map((r) => tr('td', ...r)).join('')}</tbody></table>`;

test('GFM tables: migration note rows with escaped pipes in code, bold and links', () => {
	const src = [
		'### 0.18 → 0.54',
		'',
		'| Area | Before (0.18) | After | Action |',
		'| --- | --- | --- | --- |',
		"| Theme store types (0.24) | `theme.current: Mode` | `theme.current: ThemeId` (`Mode \\| string`) | Handle `undefined`. |",
		'| Control heights (0.27, 0.39) **(notes)** | FilterInput md were 44px | md uses `--control-height-default` (40px) | Visual check. |',
		"| `Button` `loading` | `boolean` | `boolean \\| 'done'` | None. See [docs](https://e.com/x). |",
	].join('\n');
	assert.equal(
		renderMarkdown(src, { autolink: false }),
		'<h3>0.18 → 0.54</h3>' +
			tbl(
				['Area', 'Before (0.18)', 'After', 'Action'],
				['Theme store types (0.24)', '<code>theme.current: Mode</code>', '<code>theme.current: ThemeId</code> (<code>Mode | string</code>)', 'Handle <code>undefined</code>.'],
				['Control heights (0.27, 0.39) <strong>(notes)</strong>', 'FilterInput md were 44px', 'md uses <code>--control-height-default</code> (40px)', 'Visual check.'],
				['<code>Button</code> <code>loading</code>', '<code>boolean</code>', "<code>boolean | 'done'</code>", 'None. See <a href="https://e.com/x" target="_blank" rel="noopener noreferrer">docs</a>.'],
			),
	);
});

test('GFM tables: directly after a paragraph or heading, ended by a blank line or another block', () => {
	assert.equal(renderMarkdown('Intro\n| a |\n| - |\n| 1 |\n\nafter'), `<p>Intro</p>${tbl(['a'], ['1'])}<p>after</p>`);
	assert.equal(renderMarkdown('## H\n| a |\n| - |\n| 1 |\n> q'), `<h2>H</h2>${tbl(['a'], ['1'])}<blockquote><p>q</p></blockquote>`);
	assert.equal(renderMarkdown('| a |\n| - |\n| 1 |\n```\nx\n```'), `${tbl(['a'], ['1'])}<pre><code>x</code></pre>`);
});

test('GFM tables: outer pipes optional, ragged rows padded or truncated to the header', () => {
	assert.equal(renderMarkdown('a | b\n--- | ---\n1 | 2'), tbl(['a', 'b'], ['1', '2']));
	assert.equal(renderMarkdown('| a | b\n|---|---\n| 1 | 2'), tbl(['a', 'b'], ['1', '2']));
	assert.equal(renderMarkdown('| a | b | c |\n| - | - | - |\n| 1 |'), tbl(['a', 'b', 'c'], ['1', '', '']));
	assert.equal(renderMarkdown('| a |\n| - |\n| 1 | 2 | 3 |'), tbl(['a'], ['1']));
	assert.equal(renderMarkdown('| a | b |\n| - | - |\n| 1 | 2 |\nbar'), tbl(['a', 'b'], ['1', '2'], ['bar', '']));
	assert.equal(renderMarkdown('| a | b |\n| - | - |\n|  | 2 |'), tbl(['a', 'b'], ['', '2']));
	assert.equal(renderMarkdown('| a |\n| - |\n| x \\| |'), tbl(['a'], ['x |']));
});

test('GFM tables: header and delimiter cell counts must match; centre alignment', () => {
	assert.doesNotMatch(renderMarkdown('| a | b |\n| - |\n| 1 | 2 |'), /<table/);
	assert.doesNotMatch(renderMarkdown('a\n---'), /<table/);
	assert.equal(
		renderMarkdown('| a | b | c |\n|:-|:-:|-:|\n| 1 | 2 | 3 |'),
		'<table><thead><tr><th style="text-align:left">a</th><th style="text-align:center">b</th><th style="text-align:right">c</th></tr></thead>' +
			'<tbody><tr><td style="text-align:left">1</td><td style="text-align:center">2</td><td style="text-align:right">3</td></tr></tbody></table>',
	);
});

test('docs/MIGRATION-0.80.md renders the same 7 tables / 68 rows as GitHub', () => {
	const out = renderMarkdown(readFileSync(new URL('../docs/MIGRATION-0.80.md', import.meta.url), 'utf8'));
	assert.equal(out.match(/<table>/g)?.length, 7);
	assert.equal(out.match(/<tr>/g)?.length, 68);
	assert.doesNotMatch(out, /<p>\|/);
});

test('control characters are dropped, CRLF normalised, empty input renders nothing', () => {
	assert.equal(renderMarkdown('a\x1b[31mb\r\nc\x00'), '<p>ab<br />c</p>');
	assert.equal(renderMarkdown(''), '');
	assert.equal(renderMarkdown('\n\n'), '');
});

test('inline code is literal: no emphasis or links inside it', () => {
	assert.equal(renderMarkdown('use `a * b * c` here'), '<p>use <code>a * b * c</code> here</p>');
	assert.equal(renderMarkdown('call `**kwargs**`'), '<p>call <code>**kwargs**</code></p>');
	assert.equal(renderMarkdown('see `[x](https://e.com)`'), '<p>see <code>[x](https://e.com)</code></p>');
	assert.equal(renderMarkdown('`_a_ ~~b~~`'), '<p><code>_a_ ~~b~~</code></p>');
});

test('URLs with _x_ segments stay whole; emphasis around a URL still applies', () => {
	const ext = 'target="_blank" rel="noopener noreferrer"';
	assert.equal(
		renderMarkdown('path https://e.com/_next_/x ok'),
		`<p>path <a href="https://e.com/_next_/x" ${ext}>https://e.com/_next_/x</a> ok</p>`
	);
	assert.equal(
		renderMarkdown('[**b** x](https://e.com/_a_)'),
		`<p><a href="https://e.com/_a_" ${ext}><strong>b</strong> x</a></p>`
	);
	assert.equal(renderMarkdown('**https://e.com**'), `<p><strong><a href="https://e.com" ${ext}>https://e.com</a></strong></p>`);
	assert.equal(renderMarkdown('_https://e.com_'), `<p><em><a href="https://e.com" ${ext}>https://e.com</a></em></p>`);
	assert.equal(renderMarkdown('x https://e.com/_a_ y', { autolink: false }), '<p>x https://e.com/_a_ y</p>');
});
