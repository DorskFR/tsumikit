import type { SelectOption } from './components/atoms/Select.svelte';

export type OptionSection = { group?: string; options: SelectOption[] };

export function sectionOptions(options: SelectOption[]): OptionSection[] {
	const sections: OptionSection[] = [];
	const byGroup = new Map<string, OptionSection>();
	for (const option of options) {
		if (option.group === undefined) {
			const tail = sections.at(-1);
			if (tail && tail.group === undefined) tail.options.push(option);
			else sections.push({ options: [option] });
			continue;
		}
		let section = byGroup.get(option.group);
		if (!section) {
			section = { group: option.group, options: [] };
			byGroup.set(option.group, section);
			sections.push(section);
		}
		section.options.push(option);
	}
	return sections;
}
