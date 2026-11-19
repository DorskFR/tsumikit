import { base } from '$app/paths';
import { byId, type DemoEntry, resolveRef } from './registry';

export const pageOf = (entry: DemoEntry): string => `${base}/${entry.family}/${entry.id}`;

/** Route of a section id or a `seeAlso` name. */
export function pathOf(ref: string): string | undefined {
	const entry = byId.get(resolveRef(ref));
	return entry && pageOf(entry);
}
