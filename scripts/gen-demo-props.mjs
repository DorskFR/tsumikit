import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const COMPONENTS = join(ROOT, 'src/lib/components');
export const OUTPUT = join(ROOT, 'src/demo/props.generated.json');

const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
const INHERITED_RE = /[\\/]node_modules[\\/]svelte[\\/]/;

/**
 * @typedef {{ name: string, type: string, optional: boolean, default?: string, bindable?: boolean, description?: string }} Prop
 * @typedef {{ file: string, family: string, props: Prop[] }} Entry
 * @typedef {{ value: string | undefined, bindable: boolean, order: number }} Default
 */

/** @param {string} dir @returns {string[]} */
function svelteFiles(dir) {
	return readdirSync(dir, { withFileTypes: true, recursive: true })
		.filter((d) => d.isFile() && d.name.endsWith('.svelte'))
		.map((d) => join(d.parentPath, d.name))
		.sort();
}

/** @param {string} generics @returns {string} */
function genericAliases(generics) {
	const fn = ts.createSourceFile('g.ts', `function g<${generics}>() {}`, ts.ScriptTarget.Latest)
		.statements[0];
	if (!ts.isFunctionDeclaration(fn)) return '';
	return (fn.typeParameters ?? []).map((p) => `type ${p.name.text} = unknown;`).join('\n');
}

/** Both script blocks of a component as one TS module, module script first. @param {string} svelte */
function scriptSource(svelte) {
	let moduleBlock = '';
	let instance = '';
	let generics = '';
	for (const m of svelte.matchAll(SCRIPT_RE)) {
		const attrs = m[1];
		if (/\bmodule\b/.test(attrs)) moduleBlock = m[2];
		else {
			instance = m[2];
			generics = /generics="([^"]*)"/.exec(attrs)?.[1] ?? '';
		}
	}
	return `${moduleBlock}\n${generics ? genericAliases(generics) : ''}\n${instance}`;
}

/** The `let {...}: T = $props()` declaration. @param {ts.SourceFile} sf @returns {ts.VariableDeclaration | undefined} */
function findProps(sf) {
	/** @type {ts.VariableDeclaration | undefined} */
	let found;
	/** @param {ts.Node} node */
	const visit = (node) => {
		if (found) return;
		if (
			ts.isVariableDeclaration(node) &&
			node.initializer &&
			ts.isCallExpression(node.initializer) &&
			ts.isIdentifier(node.initializer.expression) &&
			node.initializer.expression.text === '$props'
		) {
			found = node;
			return;
		}
		ts.forEachChild(node, visit);
	};
	visit(sf);
	return found;
}

/**
 * Appends a default export so `ComponentProps<typeof X>` resolves across virtual modules.
 * @param {string} source @param {ts.VariableDeclaration | undefined} decl
 */
function withComponentExport(source, decl) {
	const typeText = decl?.type ? decl.type.getText() : 'Record<string, never>';
	return `${source}\ntype __Props = ${typeText};\ndeclare const __Component: import('svelte').Component<__Props>;\nexport default __Component;\n`;
}

/** @param {ts.CompilerOptions} options @param {Map<string, string>} virtual */
function createHost(options, virtual) {
	const host = ts.createCompilerHost(options, true);
	const base = { fileExists: host.fileExists, readFile: host.readFile };
	host.fileExists = (f) => virtual.has(f) || base.fileExists(f);
	host.readFile = (f) => virtual.get(f) ?? base.readFile(f);
	host.getSourceFile = (f, lang) => {
		const text = host.readFile(f);
		return text === undefined ? undefined : ts.createSourceFile(f, text, lang, true);
	};
	host.resolveModuleNames = (names, containing) =>
		names.map((name) => {
			const r = ts.resolveModuleName(name, containing, options, host).resolvedModule;
			if (r) return r;
			if (!name.endsWith('.svelte')) return undefined;
			const target = name.startsWith('$lib/')
				? join(ROOT, 'src/lib', name.slice(5))
				: resolve(dirname(containing.replace(/\.svelte\.ts$/, '.svelte')), name);
			const file = `${target}.ts`;
			return virtual.has(file) ? { resolvedFileName: file, extension: ts.Extension.Ts } : undefined;
		});
	return host;
}

/** @param {ts.Node} node */
function leadingComment(node) {
	const text = node.getSourceFile().getFullText();
	const ranges = ts.getLeadingCommentRanges(text, node.getFullStart()) ?? [];
	const lines = [];
	for (const r of ranges) {
		const raw = text.slice(r.pos, r.end);
		const body =
			r.kind === ts.SyntaxKind.MultiLineCommentTrivia
				? raw.replace(/^\/\*+/, '').replace(/\*+\/$/, '')
				: raw.replace(/^\/\//, '');
		for (const line of body.split('\n')) lines.push(line.replace(/^\s*\*\s?/, '').trim());
	}
	return lines.filter(Boolean).join(' ');
}

/** @param {ts.Declaration} d */
const isInherited = (d) => INHERITED_RE.test(d.getSourceFile().fileName);

/** @param {ts.ObjectBindingPattern} pattern @returns {Map<string, Default>} */
function readDefaults(pattern) {
	/** @type {Map<string, Default>} */
	const defaults = new Map();
	for (const el of pattern.elements) {
		if (el.dotDotDotToken) continue;
		const key = el.propertyName ?? el.name;
		const name = ts.isIdentifier(key) || ts.isStringLiteral(key) ? key.text : key.getText();
		let init = el.initializer;
		let bindable = false;
		if (
			init &&
			ts.isCallExpression(init) &&
			ts.isIdentifier(init.expression) &&
			init.expression.text === '$bindable'
		) {
			bindable = true;
			init = init.arguments[0];
		}
		defaults.set(name, { value: init?.getText(), bindable, order: defaults.size });
	}
	return defaults;
}

/** @returns {Record<string, Entry>} */
export function generate() {
	const files = svelteFiles(COMPONENTS);
	/** @type {Map<string, string>} */
	const virtual = new Map();
	for (const file of files) {
		const source = scriptSource(readFileSync(file, 'utf8'));
		const probe = ts.createSourceFile(`${file}.ts`, source, ts.ScriptTarget.Latest, true);
		virtual.set(`${file}.ts`, withComponentExport(source, findProps(probe)));
	}

	/** @type {ts.CompilerOptions} */
	const options = {
		strict: true,
		noEmit: true,
		skipLibCheck: true,
		target: ts.ScriptTarget.ESNext,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		lib: ['lib.esnext.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
		allowImportingTsExtensions: true,
		resolveJsonModule: true,
		baseUrl: ROOT,
		paths: { $lib: ['src/lib'], '$lib/*': ['src/lib/*'] },
	};
	const host = createHost(options, virtual);
	const program = ts.createProgram([...virtual.keys()], options, host);
	const checker = program.getTypeChecker();

	/** @type {Record<string, Entry>} */
	const out = {};
	for (const file of files) {
		const sf = program.getSourceFile(`${file}.ts`);
		const decl = sf && findProps(sf);
		if (!decl?.type) continue;

		const defaults = ts.isObjectBindingPattern(decl.name) ? readDefaults(decl.name) : new Map();
		const type = checker.getTypeFromTypeNode(decl.type);
		/** @type {{ prop: Prop, order: number }[]} */
		const props = [];
		for (const sym of type.getProperties()) {
			const decls = sym.getDeclarations() ?? [];
			if (decls.length > 0 && decls.every(isInherited)) continue;
			const own = decls.find((d) => !isInherited(d));
			const typeNode = own && ts.isPropertySignature(own) ? own.type : undefined;
			const typeText = typeNode
				? typeNode.getText().replace(/\s+/g, ' ')
				: checker.typeToString(
						checker.getTypeOfSymbolAtLocation(sym, decl),
						undefined,
						ts.TypeFormatFlags.NoTruncation
					);
			const description = own ? leadingComment(own) : '';
			const def = defaults.get(sym.getName());
			/** @type {Prop} */
			const prop = {
				name: sym.getName(),
				type: typeText,
				optional: Boolean(sym.flags & ts.SymbolFlags.Optional),
			};
			if (def?.value !== undefined) prop.default = def.value;
			if (def?.bindable) prop.bindable = true;
			if (description) prop.description = description;
			props.push({ prop, order: def?.order ?? Number.MAX_SAFE_INTEGER });
		}
		props.sort((a, b) => a.order - b.order);
		const rel = relative(COMPONENTS, file).split('\\').join('/');
		const name = rel.slice(rel.lastIndexOf('/') + 1, -'.svelte'.length);
		out[name] = {
			file: rel,
			family: rel.slice(0, rel.indexOf('/')),
			props: props.map((p) => p.prop),
		};
	}
	return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

/** @param {Record<string, Entry>} data */
export function serialize(data) {
	return `${JSON.stringify(data, null, '\t')}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const data = generate();
	writeFileSync(OUTPUT, serialize(data));
	console.log(`${Object.keys(data).length} components → ${relative(ROOT, OUTPUT)}`);
}
