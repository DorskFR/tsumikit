import type { Component } from 'svelte';
import { FAMILIES, type Family } from './catalog';
import { exampleOrder, exampleSlug, kebab, stripModuleScript } from './snippet';

export type ExampleLayout = 'row' | 'stack' | 'grid' | 'center' | 'frame';

export type ExampleMeta = {
	title: string;
	caption?: string;
	layout?: ExampleLayout;
	/** Preview height (any CSS length); mostly for `frame` layouts. */
	height?: string;
	/** Horizontal CSS resize handle on the preview, for container-query components. */
	resizable?: boolean;
};

export type ComponentMeta = {
	/** Display name; defaults to the directory name. */
	name?: string;
	description: string;
	keywords?: string[];
	/** Section ids (`'icon-button'`) or component names (`'IconButton'`). */
	seeAlso?: string[];
	/** Sort key inside the family; alphabetical by default. */
	order?: number;
};

export type DemoExample = {
	id: string;
	slug: string;
	file: string;
	meta: ExampleMeta;
	component: Component;
	source: string;
};

export type DemoEntry = {
	id: string;
	name: string;
	family: Family;
	meta: ComponentMeta;
	examples: DemoExample[];
};

type ExampleModule = { default: Component; meta?: ExampleMeta };

const metaModules = import.meta.glob<{ meta: ComponentMeta }>('../*/*/meta.ts', { eager: true });
const exampleModules = import.meta.glob<ExampleModule>('../*/*/*.svelte', { eager: true });
const exampleSources = import.meta.glob<string>('../*/*/*.svelte', {
	eager: true,
	query: '?raw',
	import: 'default',
});

const isFamily = (s: string): s is Family => (FAMILIES as readonly string[]).includes(s);

function split(path: string): { family: Family; dir: string; file: string } | null {
	const m = path.match(/^\.\.\/([a-z]+)\/([^/]+)\/([^/]+)$/);
	if (!m || !isFamily(m[1])) return null;
	return { family: m[1], dir: m[2], file: m[3] };
}

function build(): DemoEntry[] {
	const byDir = new Map<string, DemoEntry>();
	const key = (family: Family, dir: string) => `${family}/${dir}`;

	for (const [path, mod] of Object.entries(metaModules)) {
		const at = split(path);
		if (!at) continue;
		const meta = mod.meta;
		byDir.set(key(at.family, at.dir), {
			id: kebab(at.dir),
			name: meta.name ?? at.dir,
			family: at.family,
			meta,
			examples: [],
		});
	}

	for (const [path, mod] of Object.entries(exampleModules)) {
		const at = split(path);
		if (!at) continue;
		const entry = byDir.get(key(at.family, at.dir));
		if (!entry) {
			if (import.meta.env.DEV) console.warn(`[demo] ${path} has no meta.ts beside it`);
			continue;
		}
		const slug = exampleSlug(at.file);
		entry.examples.push({
			id: `${entry.id}--${slug}`,
			slug,
			file: at.file,
			meta: mod.meta ?? { title: slug },
			component: mod.default,
			source: stripModuleScript(exampleSources[path] ?? ''),
		});
	}

	const entries = [...byDir.values()];
	for (const e of entries) e.examples.sort((a, b) => exampleOrder(a.file) - exampleOrder(b.file));
	entries.sort(
		(a, b) =>
			FAMILIES.indexOf(a.family) - FAMILIES.indexOf(b.family) ||
			(a.meta.order ?? 0) - (b.meta.order ?? 0) ||
			a.name.localeCompare(b.name),
	);
	return entries;
}

export const entries: DemoEntry[] = build();
export const byId = new Map(entries.map((e) => [e.id, e]));
export const byName = new Map(entries.map((e) => [e.name, e]));

export const groups: { family: Family; entries: DemoEntry[] }[] = FAMILIES.map((family) => ({
	family,
	entries: entries.filter((e) => e.family === family),
})).filter((g) => g.entries.length > 0);

export function searchText(e: DemoEntry): string {
	return [e.name, e.id, e.family, e.meta.description, ...(e.meta.keywords ?? [])]
		.join(' ')
		.toLowerCase();
}

/** Resolve a `seeAlso` entry (name or id) to a section id. */
export function resolveRef(ref: string): string {
	return byName.get(ref)?.id ?? kebab(ref);
}
