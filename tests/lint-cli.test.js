import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';

const run = promisify(execFile);
const cli = fileURLToPath(new URL('../lint/cli.mjs', import.meta.url));
const root = fileURLToPath(new URL('..', import.meta.url));

async function cliRun(args) {
	try {
		const { stdout, stderr } = await run(process.execPath, [cli, ...args], { cwd: root });
		return { code: 0, stdout, stderr };
	} catch (e) {
		return { code: e.code, stdout: e.stdout, stderr: e.stderr };
	}
}

test('cli prints file:line:col text with a summary and exits 1 on findings', async () => {
	const { code, stdout } = await cliRun(['tests/fixtures/lint/img-alt.svelte']);
	assert.equal(code, 1);
	assert.match(stdout, /^tests\/fixtures\/lint\/img-alt\.svelte:5:1\s+img-alt\s+<img> without alt/m);
	assert.match(stdout, /1 problem in 1 file \(img-alt: 1\)/);
});

test('cli --json emits findings and errorCount', async () => {
	const { code, stdout } = await cliRun(['--json', '--rule', 'motion', 'tests/fixtures/lint/motion.css']);
	assert.equal(code, 1);
	const report = JSON.parse(stdout);
	assert.equal(report.files, 1);
	assert.equal(report.errorCount, 5);
	assert.deepEqual(Object.keys(report.findings[0]), ['file', 'line', 'column', 'rule', 'message']);
	assert.ok(report.findings.every((f) => f.rule === 'motion'));
});

test('cli --disable removes a rule and exits 0 when nothing is left', async () => {
	const { code, stdout } = await cliRun(['--disable=img-alt', 'tests/fixtures/lint/img-alt.svelte']);
	assert.equal(code, 0);
	assert.match(stdout, /no problems in 1 file/);
});

test('cli exits 2 on unknown rules, options and paths', async () => {
	assert.equal((await cliRun(['--rule', 'nope', 'tests/fixtures/lint'])).code, 2);
	assert.equal((await cliRun(['--bogus'])).code, 2);
	assert.equal((await cliRun(['tests/fixtures/lint/does-not-exist'])).code, 2);
});

test('cli --list-rules and --help', async () => {
	const list = await cliRun(['--list-rules']);
	assert.equal(list.code, 0);
	assert.equal(list.stdout.trim().split('\n').length, 8);
	const help = await cliRun(['--help']);
	assert.match(help.stdout, /tsumikit-lint-ignore/);
});
