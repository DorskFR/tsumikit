import generated from '../props.generated.json';
import type { DemoEntry } from './registry';
import { kebab } from './snippet';

export type PropRow = {
	name: string;
	type: string;
	optional: boolean;
	default?: string;
	bindable?: boolean;
	description?: string;
};

export type PropsEntry = { file: string; family: string; props: PropRow[] };

export const tables: Record<string, PropsEntry> = generated;

export function propsFor(entry: Pick<DemoEntry, 'id' | 'family'>): PropRow[] | undefined {
	return Object.entries(tables).find(
		([name, e]) => e.family === entry.family && kebab(name) === entry.id,
	)?.[1].props;
}
