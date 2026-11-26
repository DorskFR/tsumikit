import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { buildFixture } from './fixtures/build.mjs';

const PLAYWRIGHT = 'playwright';

/** @returns {Promise<any>} */
async function chromium() {
	try {
		const { chromium } = await import(PLAYWRIGHT);
		await (await chromium.launch()).close();
		return chromium;
	} catch {
		return null;
	}
}

const browser = await chromium();
const skip = browser ? false : 'playwright chromium cannot launch';

const styles = (
	await Promise.all(
		['tokens', 'themes', 'reset', 'utilities'].map((f) => readFile(new URL(`../src/lib/styles/${f}.css`, import.meta.url), 'utf8'))
	)
).join('\n');

const SLABS = {
	inline: '#inline',
	inlineDanger: '#inline-danger',
	link: '#link',
	linkAccent: '#link-primary',
	bare: '.pop-trigger.bare',
	badge: '#badge .action',
	switch: '.switch',
	checkbox: '.checkbox',
	toggle: '.toggle'
};
const AMBIENT = { ghost: '#ghost', icon: '#icon' };

/** @param {{ fx: string | null, motion: 'reduce' | 'no-preference' }} opts */
async function inspect({ fx, motion }) {
	const bundle = await buildFixture('mount-hit-overlay.js');
	const instance = await browser.launch();
	try {
		const page = await instance.newPage({ viewport: { width: 600, height: 1200 }, reducedMotion: motion });
		const attr = fx ? ` data-fx-hover="${fx}"` : '';
		await page.setContent(`<!doctype html><html data-theme="dark"${attr}><head><style>${styles}</style></head><body></body></html>`);
		await page.addScriptTag({ content: bundle });
		await page.evaluate(() => {
			const { mount, flushSync, Fixture } = /** @type {any} */ (globalThis).__fixture;
			mount(Fixture, { target: document.body });
			flushSync();
		});
		const paints = (/** @type {[string, boolean]} */ [sel, opacityHides]) => {
			const el = /** @type {HTMLElement} */ (document.querySelector(sel));
			const host = el.getBoundingClientRect();
			/** @type {string[]} */
			const found = [];
			for (const pseudo of ['::before', '::after']) {
				const cs = getComputedStyle(el, pseudo);
				if (cs.content === 'none' || cs.display === 'none') continue;
				if (opacityHides && Number(cs.opacity) === 0) continue;
				const ink = [];
				if (cs.backgroundImage !== 'none') ink.push(`background-image ${cs.backgroundImage.slice(0, 60)}`);
				if (!/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor)) ink.push(`background-color ${cs.backgroundColor}`);
				if (cs.boxShadow !== 'none') ink.push(`box-shadow ${cs.boxShadow}`);
				if (cs.outlineStyle !== 'none' && Number.parseFloat(cs.outlineWidth) > 0) ink.push(`outline ${cs.outlineStyle} ${cs.outlineWidth}`);
				if (['top', 'right', 'bottom', 'left'].some((s) => Number.parseFloat(cs.getPropertyValue(`border-${s}-width`)) > 0 && cs.getPropertyValue(`border-${s}-style`) !== 'none')) ink.push('border');
				if (cs.filter !== 'none' || cs.backdropFilter !== 'none') ink.push('filter');
				if (Number.parseFloat(cs.width) > host.width + 24) ink.push(`width ${cs.width} over a ${host.width}px host`);
				if (ink.length) found.push(`${pseudo}: ${ink.join('; ')}`);
			}
			return found;
		};
		/** @type {Record<string, string[]>} */
		const out = {};
		const record = async (/** @type {string} */ key, /** @type {string} */ sel, /** @type {boolean} */ opacityHides) => {
			const found = await page.evaluate(paints, /** @type {[string, boolean]} */ ([sel, opacityHides]));
			if (found.length) out[key] = found;
		};
		for (const [name, sel] of Object.entries(AMBIENT)) await record(`${name} at rest`, sel, true);
		for (const [name, sel] of Object.entries(SLABS)) {
			await page.mouse.move(590, 1190);
			await record(`${name} at rest`, sel, false);
			await page.hover(sel);
			await record(`${name} hovered`, sel, false);
			await page.mouse.move(590, 1190);
			await page.focus(sel);
			await record(`${name} focused`, sel, false);
			await page.evaluate(() => /** @type {HTMLElement} */ (document.activeElement)?.blur());
		}
		return out;
	} finally {
		await instance.close();
	}
}

for (const fx of [null, 'smoke', 'ember', 'aurora']) {
	for (const motion of /** @type {const} */ (['no-preference', 'reduce'])) {
		test(`hit slabs paint nothing (fx ${fx ?? 'default'}, motion ${motion})`, { skip }, async () => {
			const report = await inspect({ fx, motion });
			assert.deepEqual(report, {}, JSON.stringify(report, null, 1));
		});
	}
}
