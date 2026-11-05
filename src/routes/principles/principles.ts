import { renderMarkdown } from '@dorsk/tsumikit';

export interface Principle {
	id: string;
	title: string;
	lead: string;
	html: string;
}

const files = import.meta.glob<string>('/principles/*.md', {
	query: '?raw',
	import: 'default',
	eager: true,
});

export const anchorOf = (id: string) => `p-${id}`;

function relink(md: string): string {
	return md.replace(/\]\((\d{2})-[\w-]+\.md\)/g, (_m, id) => `](#${anchorOf(id)})`);
}

function demote(md: string): string {
	return md.replace(/^(#{1,5}) /gm, '#$1 ');
}

function parse(path: string, raw: string): Principle | null {
	const id = path.match(/\/(\d{2})-[\w-]+\.md$/)?.[1];
	if (!id) return null;
	const lines = raw.split('\n');
	const titleAt = lines.findIndex((l) => l.startsWith('# '));
	const title = lines[titleAt].slice(2).trim();
	const rest = lines.slice(titleAt + 1);
	const leadAt = rest.findIndex((l) => l.trim());
	const lead = rest[leadAt].trim();
	const body = rest.slice(leadAt + 1).join('\n');
	return { id, title, lead, html: renderMarkdown(demote(relink(body))) };
}

export const principles: Principle[] = Object.entries(files)
	.map(([path, raw]) => parse(path, raw))
	.filter((p): p is Principle => p !== null)
	.sort((a, b) => a.id.localeCompare(b.id));

const readme = files['/principles/README.md'] ?? '';

export const overviewHtml = renderMarkdown(
	demote(relink(readme.replace(/^# .*\n/, '').replace(/^## Index\n[\s\S]*?(?=^## )/m, ''))),
);
