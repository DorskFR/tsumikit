export function kebab(name: string): string {
	return name
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
		.toLowerCase();
}

const MODULE_SCRIPT = /^\s*<script\s+module(?:\s+lang=["']ts["'])?\s*>[\s\S]*?<\/script>\s*/;

/** The example file minus its `<script module>` meta block: what the Code panel shows. */
export function stripModuleScript(source: string): string {
	return source.replace(MODULE_SCRIPT, '');
}

/** `03-States.svelte` → `states`; `01-Overview.svelte` → `overview`. */
export function exampleSlug(file: string): string {
	const name =
		file
			.split('/')
			.pop()
			?.replace(/\.svelte$/, '') ?? file;
	return kebab(name.replace(/^\d+-/, ''));
}

export function exampleOrder(file: string): number {
	const m = file
		.split('/')
		.pop()
		?.match(/^(\d+)-/);
	return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
}
