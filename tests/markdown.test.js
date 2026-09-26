import assert from 'node:assert/strict';
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

test('control characters are dropped, CRLF normalised, empty input renders nothing', () => {
	assert.equal(renderMarkdown('a\x1b[31mb\r\nc\x00'), '<p>ab<br />c</p>');
	assert.equal(renderMarkdown(''), '');
	assert.equal(renderMarkdown('\n\n'), '');
});
