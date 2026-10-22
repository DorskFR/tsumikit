import { escapeHtml } from '@dorsk/tsumikit';

const RULES: [RegExp, string][] = [
	[/(\/\/[^\n]*)/, 'hljs-comment'],
	[/('[^'\n]*'|"[^"\n]*"|`[^`]*`)/, 'hljs-string'],
	[/\b(import|from|export|const|let|function|return|await|async|if|else|type)\b/, 'hljs-keyword'],
	[/\b(true|false|null|undefined)\b/, 'hljs-literal'],
	[/\b(\d+(?:\.\d+)?)\b/, 'hljs-number'],
];

const TOKEN = new RegExp(RULES.map(([re]) => re.source).join('|'), 'gm');

export function highlight(code: string): string {
	let out = '';
	let last = 0;
	for (const m of code.matchAll(TOKEN)) {
		const i = m.index ?? 0;
		const rule = m.slice(1).findIndex((g) => g !== undefined);
		out += `${escapeHtml(code.slice(last, i))}<span class="${RULES[rule][1]}">${escapeHtml(m[0])}</span>`;
		last = i + m[0].length;
	}
	return out + escapeHtml(code.slice(last));
}
