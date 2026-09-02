import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const RELATIVE = /^\.\.?\//;
const HAS_EXT = /\.[a-z]+$/i;

export async function resolve(specifier, context, next) {
	if (RELATIVE.test(specifier) && !HAS_EXT.test(specifier) && context.parentURL) {
		const candidate = new URL(`${specifier}.ts`, context.parentURL);
		try {
			await access(fileURLToPath(candidate));
			return next(candidate.href, context);
		} catch {}
	}
	return next(specifier, context);
}
