import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} name */
const component = (name) =>
	readFile(new URL(`../src/lib/components/molecules/${name}`, import.meta.url), 'utf8');
const [popover, menu] = await Promise.all([component('Popover.svelte'), component('Menu.svelte')]);

const trigger = popover.slice(popover.indexOf('<button'), popover.indexOf('</button>'));
const panel = popover.slice(popover.indexOf('<div'), popover.indexOf('</div>'));

test('Popover exposes a role prop defaulting to dialog, rendered on the panel', () => {
	assert.match(popover, /role = 'dialog',/);
	assert.match(popover, /role\?: PanelRole;/);
	assert.match(popover, /type PanelRole = 'dialog' \| 'menu' \| 'listbox' \| 'group'/);
	assert.match(panel, /\{role\}/);
	assert.doesNotMatch(panel, /role="group"/);
});

test('Popover exposes a haspopup prop defaulting to dialog, rendered as aria-haspopup on the trigger', () => {
	assert.match(popover, /haspopup = 'dialog',/);
	assert.match(popover, /haspopup\?: HasPopup;/);
	assert.match(popover, /type HasPopup = 'menu' \| 'dialog' \| 'listbox' \| true/);
	assert.match(trigger, /aria-haspopup=\{haspopup\}/);
});

test('trigger binds aria-expanded to the live open state without unmounting kept-alive content', () => {
	assert.match(trigger, /aria-expanded=\{open\}/);
	assert.match(popover, /if \(e\.newState === 'open'\)[\s\S]*open = true;/);
	assert.match(popover, /} else {\s*open = false;/);
	assert.doesNotMatch(popover, /opened = false/);
	assert.doesNotMatch(popover, /aria-modal/);
});

test('Menu makes the Popover panel the menu and announces haspopup=menu', () => {
	const popoverTag = menu.slice(menu.indexOf('<Popover'), menu.indexOf('\n>', menu.indexOf('<Popover')));
	assert.match(popoverTag, /role="menu"/);
	assert.match(popoverTag, /haspopup="menu"/);
});

test('Menu does not double the menu role: inner list is presentational', () => {
	const list = menu.slice(menu.indexOf('<div bind:this={listEl}'), menu.indexOf('{#each'));
	assert.match(list, /role="none"/);
	assert.equal(menu.split('role="menu"').length - 1, 1);
	assert.match(menu, /role="menuitem"/);
});
