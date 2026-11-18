import type { Component } from 'svelte';
import { FAMILIES, type Family } from './catalog';
import type { PropRow } from './props';
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
	count: number;
};

export type SectionContent = { examples: DemoExample[]; props?: PropRow[] };

type ExampleModule = { default: Component; meta?: ExampleMeta };

const metaModules = import.meta.glob<{ meta: ComponentMeta }>('../*/*/meta.ts', { eager: true });
const exampleModules = import.meta.glob<ExampleModule>('../*/*/*.svelte');
const exampleSources = import.meta.glob<string>('../*/*/*.svelte', {
	query: '?raw',
	import: 'default',
});

const files = new Map<string, string[]>();

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
			count: 0,
		});
	}

	for (const path of Object.keys(exampleModules)) {
		const at = split(path);
		if (!at) continue;
		const entry = byDir.get(key(at.family, at.dir));
		if (!entry) {
			if (import.meta.env.DEV) console.warn(`[demo] ${path} has no meta.ts beside it`);
			continue;
		}
		entry.count++;
		files.set(entry.id, [...(files.get(entry.id) ?? []), path]);
	}

	for (const paths of files.values())
		paths.sort((a, b) => exampleOrder(a) - exampleOrder(b) || a.localeCompare(b));
	const entries = [...byDir.values()];
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

const loads = new Map<string, Promise<SectionContent>>();
const loaded = new Map<string, SectionContent>();

async function example(entry: DemoEntry, path: string): Promise<DemoExample> {
	const file = path.slice(path.lastIndexOf('/') + 1);
	const slug = exampleSlug(file);
	const [mod, raw] = await Promise.all([exampleModules[path](), exampleSources[path]()]);
	return {
		id: `${entry.id}--${slug}`,
		slug,
		file,
		meta: mod.meta ?? { title: slug },
		component: mod.default,
		source: stripModuleScript(raw),
	};
}

/** Import a section's example components, sources and props table; cached per section. */
export function loadSection(entry: DemoEntry): Promise<SectionContent> {
	let load = loads.get(entry.id);
	if (!load) {
		load = Promise.all([
			Promise.all((files.get(entry.id) ?? []).map((path) => example(entry, path))),
			import('./props'),
		]).then(
			([examples, props]) => {
				const content = { examples, props: props.propsFor(entry) };
				loaded.set(entry.id, content);
				return content;
			},
			(err) => {
				loads.delete(entry.id);
				throw err;
			},
		);
		loads.set(entry.id, load);
	}
	return load;
}

export function loadedSection(entry: DemoEntry): SectionContent | undefined {
	return loaded.get(entry.id);
}
