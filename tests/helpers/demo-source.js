import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const LEGACY = join(ROOT, 'src/routes/legacy/+page.svelte');
const DEMO = join(ROOT, 'src/demo');

/** The legacy page first, then every `src/demo/**` source (.svelte, .ts). */
export async function demoFiles() {
	/** @type {string[]} */
	const out = [];
	const walk = async (/** @type {string} */ dir) => {
		for (const d of await readdir(dir, { withFileTypes: true })) {
			const p = join(dir, d.name);
			if (d.isDirectory()) await walk(p);
			else if (/\.(svelte|ts)$/.test(d.name)) out.push(p);
		}
	};
	await walk(DEMO);
	return [LEGACY, ...out.sort()];
}

/** The showcase sources concatenated, for contract tests that string-match the demo. */
export async function readDemo() {
	const files = await demoFiles();
	return (await Promise.all(files.map((f) => readFile(f, 'utf8')))).join('\n');
}
