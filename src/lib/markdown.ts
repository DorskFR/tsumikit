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
const BARE_URL_RE = new RegExp(`\\bhttps?://(?:&amp;|[^\\s&<>"${SPAN_L}${SPAN_R}])+`, 'g');
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

// Inline passes on already-escaped text; emphasis never reaches inside code, link tags or URLs.
function inline(s: string, autolink: boolean): string {
	const held: string[] = [];
	const hold = (html: string) => `${SPAN_L}${held.push(html) - 1}${SPAN_R}`;
	s = s.replace(/`([^`]+)`/g, (_m, code: string) => hold(`<code>${code}</code>`));
	s = s.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, (m, text: string, url: string) => {
		const href = safeHref(url);
		if (!href) return m;
		const external = /^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
		return `${hold(`<a href="${href}"${external}>`)}${text}${hold('</a>')}`;
	});
	s = s.replace(BARE_URL_RE, (raw) => {
		const url = raw.replace(/[*_~]+$/, '');
		return hold(url) + raw.slice(url.length);
	});
	s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	s = s.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>');
	s = s.replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
	s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
	s = s.replace(SPAN_RE, (_m, i) => held[Number(i)]);
	return autolink ? autolinkUrls(s) : s;
}

function splitRow(row: string): string[] {
	const cells: string[] = [];
	let cur = '';
	let t = row.trim();
	if (t.startsWith('|')) t = t.slice(1);
	for (let i = 0; i < t.length; i++) {
		if (t[i] === '\\' && t[i + 1] === '|') {
			cur += '|';
			i++;
		} else if (t[i] === '|') {
			cells.push(cur);
			cur = '';
		} else cur += t[i];
	}
	if (cur.trim() || !cells.length) cells.push(cur);
	return cells;
}

const hasPipe = (line: string) => /(?:^|[^\\])\|/.test(line);
const DELIM_CELL = /^\s*:?-+:?\s*$/;
const TABLE_BREAK = new RegExp(
	`^\\s*(?:$|#{1,6}(?:\\s|$)|&gt;|(?:[-*+]|\\d{1,9}[.)])\\s|(?:-{3,}|\\*{3,}|_{3,})\\s*$|${BLOCK_L}\\d+${BLOCK_R}\\s*$)`,
);

function table(header: string, delim: string[], body: string[], autolink: boolean): string {
	const aligns = delim.map((c) => {
		const l = c.trim().startsWith(':');
		const r = c.trim().endsWith(':');
		return r && l ? 'center' : r ? 'right' : l ? 'left' : '';
	});
	const row = (line: string, tag: 'th' | 'td') => {
		const cells = splitRow(line);
		const html = aligns.map((a, i) => {
			const style = a ? ` style="text-align:${a}"` : '';
			return `<${tag}${style}>${inline((cells[i] ?? '').trim(), autolink)}</${tag}>`;
		});
		return `<tr>${html.join('')}</tr>`;
	};
	const head = row(header, 'th');
	const rows = body.map((r) => row(r, 'td')).join('');
	return `<table><thead>${head}</thead><tbody>${rows}</tbody></table>`;
}

// GFM pipe tables on escaped text: a header row, a delimiter row with the
// same cell count, then rows up to a blank line or the start of another block.
function tables(s: string, saved: string[], autolink: boolean): string {
	const lines = s.split('\n');
	const out: string[] = [];
	for (let i = 0; i < lines.length; i++) {
		const head = lines[i];
		const next = lines[i + 1];
		if (next === undefined || !hasPipe(head) || !hasPipe(next) || TABLE_BREAK.test(head)) {
			out.push(head);
			continue;
		}
		const delim = splitRow(next);
		const cols = splitRow(head);
		if (!delim.every((c) => DELIM_CELL.test(c)) || cols.length !== delim.length) {
			out.push(head);
			continue;
		}
		let j = i + 2;
		while (j < lines.length && !TABLE_BREAK.test(lines[j])) j++;
		out.push('', stash(saved, table(head, delim, lines.slice(i + 2, j), autolink)), '');
		i = j - 1;
	}
	return out.join('\n');
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
	const withTables = opts.tables !== false;
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
	if (withTables) s = tables(s, saved, autolink);
	s = inline(s, autolink);
	s = blocks(s.split('\n'));
	return restore(s, saved);
}
