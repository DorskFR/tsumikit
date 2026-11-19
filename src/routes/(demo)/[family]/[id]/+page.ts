import { error } from '@sveltejs/kit';
import { entries as all, byId, loadSection } from '../../../../demo/framework/registry';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => all.map((e) => ({ family: e.family, id: e.id }));

export const load: PageLoad = async ({ params }) => {
	const entry = byId.get(params.id);
	if (!entry || entry.family !== params.family) error(404, 'No such component');
	return { entry, content: await loadSection(entry) };
};
