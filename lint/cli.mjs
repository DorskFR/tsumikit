#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { RULES, lintPaths, selectRules } from './index.mjs';

const HELP = `tsumikit-lint [options] [paths...]

Flags drift from the kit's design rules in .svelte and .css files.
Defaults to ./src when no path is given.

Options:
  --json             machine-readable output
  --rule <id>        run only this rule (repeatable, comma-separated)
  --disable <id>     skip this rule (repeatable, comma-separated)
  --list-rules       print the rule ids and exit
  -h, --help         show this help

Suppress a line with a comment on the line above:
  /* tsumikit-lint-ignore spacing-scale */   (css)
  <!-- tsumikit-lint-ignore no-raw-control -->   (markup)

Rules:
${RULES.map((r) => `  ${r.id.padEnd(16)} ${r.description}`).join('\n')}
`;

function parseArgs(argv) {
	const opts = { json: false, only: [], disable: [], paths: [] };
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		const next = () => {
			if (i + 1 >= argv.length) throw new Error(`${arg} needs a value`);
			return argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
		};
		if (arg === '--json') opts.json = true;
		else if (arg === '--rule') opts.only.push(...next());
		else if (arg.startsWith('--rule=')) opts.only.push(...arg.slice(7).split(','));
		else if (arg === '--disable') opts.disable.push(...next());
		else if (arg.startsWith('--disable=')) opts.disable.push(...arg.slice(10).split(','));
		else if (arg === '--list-rules') opts.list = true;
		else if (arg === '-h' || arg === '--help') opts.help = true;
		else if (arg.startsWith('-')) throw new Error(`unknown option ${arg}`);
		else opts.paths.push(arg);
	}
	return opts;
}

function formatText({ files, findings }) {
	const lines = findings.map(
		(f) => `${f.file}:${f.line}:${f.column}  ${f.rule.padEnd(16)} ${f.message}`
	);
	const byRule = new Map();
	for (const f of findings) byRule.set(f.rule, (byRule.get(f.rule) ?? 0) + 1);
	const summary = findings.length
		? `${findings.length} problem${findings.length === 1 ? '' : 's'} in ${files} file${files === 1 ? '' : 's'} (${[...byRule].map(([r, n]) => `${r}: ${n}`).join(', ')})`
		: `no problems in ${files} file${files === 1 ? '' : 's'}`;
	return [...lines, '', summary].join('\n');
}

async function main() {
	let opts;
	try {
		opts = parseArgs(process.argv.slice(2));
	} catch (e) {
		process.stderr.write(`tsumikit-lint: ${e.message}\n\n${HELP}`);
		return 2;
	}
	if (opts.help) {
		process.stdout.write(HELP);
		return 0;
	}
	if (opts.list) {
		process.stdout.write(`${RULES.map((r) => r.id).join('\n')}\n`);
		return 0;
	}
	let rules;
	try {
		rules = selectRules({ only: opts.only, disable: opts.disable });
	} catch (e) {
		process.stderr.write(`tsumikit-lint: ${e.message}\n`);
		return 2;
	}
	const paths = opts.paths.length ? opts.paths : existsSync('src') ? ['src'] : ['.'];
	for (const p of paths) {
		if (!existsSync(p)) {
			process.stderr.write(`tsumikit-lint: no such path ${p}\n`);
			return 2;
		}
	}
	const result = await lintPaths(paths, { rules });
	if (opts.json) {
		process.stdout.write(
			`${JSON.stringify({ files: result.files, errorCount: result.findings.length, findings: result.findings }, null, 2)}\n`
		);
	} else {
		process.stdout.write(`${formatText(result)}\n`);
	}
	return result.findings.length ? 1 : 0;
}

process.exitCode = await main();
