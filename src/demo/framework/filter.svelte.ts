import { entries, searchText } from './registry';

class DemoFilter {
	text = $state('');
	visible = $derived.by(() => {
		const query = this.text.trim().toLowerCase();
		return new Set(entries.filter((e) => !query || searchText(e).includes(query)).map((e) => e.id));
	});
}

/** Shared by the sidebar and the index. */
export const demoFilter = new DemoFilter();
