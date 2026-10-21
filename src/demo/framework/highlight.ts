const KEYWORDS =
	'import|export|from|const|let|var|function|return|if|else|for|of|in|new|type|interface|as|async|await|default|class|extends|typeof|satisfies';
const LITERALS = 'true|false|null|undefined';
const BLOCKS = 'each|if|else|await|then|catch|snippet|key|render|html|const|debug';

const TOKEN = new RegExp(
	[
		'(<!--[\\s\\S]*?-->|\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)',
		'((?<=[=(\\[,:{?|&+!]\\s*|\\b(?:from|return|import|case)\\s+|^\\s*)(?:"(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|`(?:[^`\\\\]|\\\\.)*`))',
		'(<\\/?)([A-Za-z][\\w.:-]*)',
		`(\\{[#:/@](?:${BLOCKS})\\b)`,
		'(\\$(?:state|derived|effect|props|bindable|inspect|host)\\b(?:\\.\\w+)?)',
		`(\\b(?:${KEYWORDS})\\b)`,
		`(\\b(?:${LITERALS})\\b)`,
		'(\\b\\d+(?:\\.\\d+)?\\b)',
		'([A-Za-z_$][\\w$:.-]*)(?==)',
	].join('|'),
	'gm',
);

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const span = (cls: string, text: string) => `<span class="${cls}">${esc(text)}</span>`;

/** Svelte / TypeScript highlighter emitting highlight.js class names (themed by styles/syntax.css). */
export function highlight(src: string): string {
	let out = '';
	let last = 0;
	for (const m of src.matchAll(TOKEN)) {
		const i = m.index ?? 0;
		out += esc(src.slice(last, i));
		last = i + m[0].length;
		const [, comment, string, tagOpen, tagName, block, rune, keyword, literal, number, attr] = m;
		if (comment) out += span('hljs-comment', comment);
		else if (string) out += span('hljs-string', string);
		else if (tagOpen)
			out += `<span class="hljs-tag">${esc(tagOpen)}${span('hljs-name', tagName)}</span>`;
		else if (block) out += span('hljs-keyword', block);
		else if (rune) out += span('hljs-built_in', rune);
		else if (keyword) out += span('hljs-keyword', keyword);
		else if (literal) out += span('hljs-literal', literal);
		else if (number) out += span('hljs-number', number);
		else if (attr) out += span('hljs-attr', attr);
	}
	return out + esc(src.slice(last));
}
