import { browser } from '$app/environment';
import { entries, loadSection } from '../demo/framework/registry';

export async function load(): Promise<void> {
	if (!browser) await Promise.all(entries.map(loadSection));
}
