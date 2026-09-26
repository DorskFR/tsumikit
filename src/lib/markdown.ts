// Markdown → HTML for chat text, meant for `Prose`. Everything is escaped
// first, then a fixed tag set is re-introduced, so no raw HTML survives.
// Highlighting is an optional hook returning safe HTML; no runtime deps.

export type Highlight = (code: string, lang: string) => string;

export type RenderMarkdownOptions = {
	/** Render GFM pipe tables as `<table>`; default true. */
	tables?: boolean;
	/** Must return HTML-safe markup for the (unescaped) code body. */
	highlight?: Highlight;
	/** Turn bare http(s) URLs into links; default true. */
	autolink?: boolean;
};

export function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

// Placeholder sentinels: control chars that never survive the C0 strip below.
const BLOCK_L = '\x0E';
const BLOCK_R = '\x0F';
const BLOCK_RE = new RegExp(`${BLOCK_L}(\\d+)${BLOCK_R}`, 'g');
const SPAN_L = '\x10';
const SPAN_R = '\x11';
const SPAN_RE = new RegExp(`${SPAN_L}(\\d+)${SPAN_R}`, 'g');
// Terminal escape sequences (the ansi-regex pattern), then the remaining C0
// controls except tab and newline, plus DEL.
const ANSI_RE =
	// biome-ignore lint/suspicious/noControlCharactersInRegex: sanitising control bytes is the point
	/[\x1B\x9B][[\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\d/#&.:=?%@~_]+)*|[a-zA-Z\d]+(?:;[-a-zA-Z\d/#&.:=?%@~_]*)*)?\x07)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-ntqry=><~]))/g;
// biome-ignore lint/suspicious/noControlCharactersInRegex: sanitising control bytes is the point
const C0_RE = /[\x00-\x08\x0B-\x1F\x7F]/g;

export function stripAnsi(s: string): string {
	return s.replace(ANSI_RE, '').replace(C0_RE, '');
}

const SAFE_HREF = /^(?:https?:|mailto:)/i;

function safeHref(url: string): string | null {
	const trimmed = url.trim();
	if (SAFE_HREF.test(trimmed)) return trimmed;
	if (/^(?:\/(?!\/)|#)/.test(trimmed)) return trimmed;
	return null;
}

function stash(blocks: string[], html: string): string {
	return `${BLOCK_L}${blocks.push(html) - 1}${BLOCK_R}`;
}

function restore(s: string, blocks: string[]): string {
	return s.replace(BLOCK_RE, (_m, i) => blocks[Number(i)]);
}

function autolinkUrls(s: string): string {
	const saved: string[] = [];
	s = s.replace(
		/<a\b[^>]*>[\s\S]*?<\/a>|<code\b[^>]*>[\s\S]*?<\/code>/g,
		(m) => `${SPAN_L}${saved.push(m) - 1}${SPAN_R}`,
	);
	s = s.replace(/\bhttps?:\/\/(?:&amp;|[^\s&<>"])+/g, (raw) => {
		let url = raw;
		let trail = '';
		const punct = url.match(/[.,;:!?]+$/);
		if (punct) {
			trail = punct[0];
			url = url.slice(0, -trail.length);
		}
		const close = url.slice(-1);
		if ((close === ')' || close === ']') && !url.includes(close === ')' ? '(' : '[')) {
			trail = close + trail;
			url = url.slice(0, -1);
		}
		if (!url) return raw;
		return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>${trail}`;
	});
	return s.replace(SPAN_RE, (_m, i) => saved[Number(i)]);
}

// Inline passes on already-escaped text.
function inline(s: string, autolink: boolean): string {
	s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
	s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	s = s.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>');
	s = s.replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
	s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
	s = s.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, (m, text: string, url: string) => {
		const href = safeHref(url);
		if (!href) return m;
		const external = /^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
		return `<a href="${href}"${external}>${text}</a>`;
	});
	return autolink ? autolinkUrls(s) : s;
}

function splitRow(row: string): string[] {
	const cells: string[] = [];
	let cur = '';
	const t = row.trim().replace(/^\|/, '').replace(/\|$/, '');
	for (let i = 0; i < t.length; i++) {
		if (t[i] === '\\' && t[i + 1] === '|') {
			cur += '|';
			i++;
		} else if (t[i] === '|') {
			cells.push(cur);
			cur = '';
		} else cur += t[i];
	}
	cells.push(cur);
	return cells;
}

const TABLE_RE =
	/(?:^|\n)([ \t]*\|.+\|[ \t]*)\n([ \t]*\|(?:[ \t]*:?-+:?[ \t]*\|)+[ \t]*)\n((?:[ \t]*\|.*\|[ \t]*(?:\n|$))+)/g;

function table(header: string, delim: string, body: string, autolink: boolean): string {
	const aligns = splitRow(delim).map((c) => {
		const l = c.trim().startsWith(':');
		const r = c.trim().endsWith(':');
		return r && l ? 'center' : r ? 'right' : l ? 'left' : '';
	});
	const cell = (txt: string, i: number, tag: 'th' | 'td') => {
		const a = aligns[i] ? ` style="text-align:${aligns[i]}"` : '';
		return `<${tag}${a}>${inline(txt.trim(), autolink)}</${tag}>`;
	};
	const head = `<tr>${splitRow(header)
		.map((c, i) => cell(c, i, 'th'))
		.join('')}</tr>`;
	const rows = body
		.split('\n')
		.filter((r) => r.trim())
		.map(
			(r) =>
				`<tr>${splitRow(r)
					.map((c, i) => cell(c, i, 'td'))
					.join('')}</tr>`,
		)
		.join('');
	return `<table><thead>${head}</thead><tbody>${rows}</tbody></table>`;
}

type ListKind = 'ul' | 'ol';

// Block pass over the escaped, inline-rendered lines. Produces paragraphs,
// headings, lists, blockquotes and rules; stashed blocks stay opaque.
function blocks(lines: string[]): string {
	const out: string[] = [];
	let para: string[] = [];
	let list: { kind: ListKind; items: string[] } | null = null;
	let quote: string[] = [];

	const flushPara = () => {
		if (para.length) out.push(`<p>${para.join('<br />')}</p>`);
		para = [];
	};
	const flushList = () => {
		if (list)
			out.push(`<${list.kind}>${list.items.map((i) => `<li>${i}</li>`).join('')}</${list.kind}>`);
		list = null;
	};
	const flushQuote = () => {
		if (quote.length) out.push(`<blockquote>${blocks(quote)}</blockquote>`);
		quote = [];
	};
	const flushAll = () => {
		flushPara();
		flushList();
		flushQuote();
	};

	for (const line of lines) {
		const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
		const item = line.match(/^\s{0,3}(?:([-*+])|(\d{1,9})[.)])\s+(.*)$/);
		const quoted = line.match(/^\s{0,3}&gt;\s?(.*)$/);
		const opaque = line.match(new RegExp(`^\\s*${BLOCK_L}\\d+${BLOCK_R}\\s*$`));

		if (quoted) {
			flushPara();
			flushList();
			quote.push(quoted[1]);
			continue;
		}
		flushQuote();

		if (!line.trim()) {
			flushPara();
			flushList();
			continue;
		}
		if (opaque) {
			flushAll();
			out.push(line.trim());
			continue;
		}
		if (/^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
			flushAll();
			out.push('<hr />');
			continue;
		}
		if (heading) {
			flushAll();
			const level = heading[1].length;
			out.push(`<h${level}>${heading[2]}</h${level}>`);
			continue;
		}
		if (item) {
			flushPara();
			const kind: ListKind = item[2] ? 'ol' : 'ul';
			if (list && list.kind !== kind) flushList();
			if (!list) list = { kind, items: [] };
			list.items.push(item[3]);
			continue;
		}
		if (list && /^\s{2,}\S/.test(line)) {
			list.items[list.items.length - 1] += `<br />${line.trim()}`;
			continue;
		}
		flushList();
		para.push(line);
	}
	flushAll();
	return out.join('');
}

export function renderMarkdown(src: string, opts: RenderMarkdownOptions = {}): string {
	const tables = opts.tables !== false;
	const autolink = opts.autolink !== false;
	const saved: string[] = [];

	let s = stripAnsi(src.replace(/\r\n?/g, '\n'));
	s = s.replace(/```([^\n`]*)\n?([\s\S]*?)```/g, (_m, info: string, code: string) => {
		const lang = (info || '').trim().split(/\s+/)[0] ?? '';
		const raw = code.replace(/\n$/, '');
		const body = opts.highlight && lang ? opts.highlight(raw, lang) : escapeHtml(raw);
		const attr = lang ? ` data-lang="${escapeHtml(lang)}"` : '';
		return stash(saved, `<pre${attr}><code>${body}</code></pre>`);
	});

	s = escapeHtml(s);
	if (tables) {
		s = s.replace(
			TABLE_RE,
			(_m, header: string, delim: string, body: string) =>
				`\n${stash(saved, table(header, delim, body, autolink))}\n`,
		);
	}
	s = inline(s, autolink);
	s = blocks(s.split('\n'));
	return restore(s, saved);
}
