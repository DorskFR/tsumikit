import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import { buildFixture } from './fixtures/build.mjs';

const PLAYWRIGHT = 'playwright';

/** @returns {Promise<any>} */
async function chromium() {
	try {
		const { chromium } = await import(PLAYWRIGHT);
		return existsSync(chromium.executablePath()) ? chromium : null;
	} catch {
		return null;
	}
}

const browser = await chromium();
const SHOTS = process.env.NC_SHOTS;
const skip = browser ? false : 'playwright chromium executable is not downloaded';

const css = async () =>
	(
		await Promise.all(
			['tokens', 'themes', 'reset', 'utilities'].map((f) =>
				readFile(new URL(`../src/lib/styles/${f}.css`, import.meta.url), 'utf8')
			)
		)
	).join('\n');

const long = 'Deploy api@4.12.0 to production across every region with a title far too long for one line';

/** @param {any} page @param {Record<string, unknown>} init */
async function mountCenter(page, init) {
	await page.evaluate((/** @type {Record<string, unknown>} */ init) => {
		const { mount, flushSync, Fixture, props } = /** @type {any} */ (globalThis).__fixture;
		const now = Date.now();
		const items = /** @type {any[]} */ (init.items ?? []).map((i, n) => ({ ...i, time: now - n * 3_600_000 }));
		const live = props({ ...init, items, sheet: 'auto' });
		mount(Fixture, { target: document.body, props: { live } });
		flushSync();
	}, init);
}

const items = [
	{
		id: 'a1',
		title: long,
		text: 'The release pipeline is waiting for a second approval before it rolls out to the eu-west and us-east clusters.',
		unread: true,
		tone: 'warning',
		actions: [
			{ id: 'approve', label: 'Approve', variant: 'primary' },
			{ id: 'reject', label: 'Reject', variant: 'danger', requiresConfirm: true },
			{ id: 'snooze', label: 'Snooze' }
		]
	},
	{ id: 'i1', title: 'Nightly backup finished', text: '3.2 GB written.', tone: 'info' },
	{ id: 'r1', title: 'Rotate the deploy token', state: 'Approved on phone', tone: 'success' }
];

for (const [width, height] of [
	[1440, 900],
	[390, 844]
])
	for (const theme of ['light', 'dark'])
		test(`NotificationCenter at ${width}px ${theme}: panel form, truncation, empty state`, { skip }, async () => {
			const [bundle, styles] = await Promise.all([buildFixture('mount-notification.svelte.js'), css()]);
			const instance = await browser.launch();
			try {
				const mobile = width < 600;
				const page = await instance.newPage({ viewport: { width, height }, hasTouch: mobile, isMobile: mobile });
				await page.setContent(
					`<!doctype html><html data-theme="${theme === 'light' ? 'light' : ''}"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${styles}</style></head><body style="padding:16px"></body></html>`
				);
				await page.addScriptTag({ content: bundle });
				await mountCenter(page, { items });
				const bell = page.locator('[data-tsu="NotificationCenter"] [aria-haspopup="dialog"]');
				assert.equal(await bell.getAttribute('aria-label'), 'Notifications, 1');
				await bell.click();
				await page.waitForTimeout(450);
				assert.equal(await bell.getAttribute('aria-expanded'), 'true');

				const form = await page.evaluate(() => ({
					popover: !!document.querySelector('.pop-panel:popover-open'),
					drawer: !!document.querySelector('dialog[open]')
				}));
				assert.deepEqual(form, mobile ? { popover: false, drawer: true } : { popover: true, drawer: false });

				const box = await page.evaluate(() => {
					const panel = /** @type {HTMLElement} */ (
						document.querySelector('dialog[open] .panel') ?? document.querySelector('.pop-panel:popover-open')
					);
					const r = panel.getBoundingClientRect();
					const title = /** @type {HTMLElement} */ (panel.querySelector('[data-id="a1"] .notif-title'));
					const t = title.getBoundingClientRect();
					const body = /** @type {HTMLElement} */ (panel.querySelector('.nc-body'));
					return {
						left: r.left,
						right: r.right,
						bottom: r.bottom,
						vw: innerWidth,
						vh: innerHeight,
						truncated: title.scrollWidth > title.clientWidth,
						titleInside: t.right <= r.right + 0.5,
						bodyOverflowX: body.scrollWidth - body.clientWidth,
						focused: document.activeElement?.getAttribute('data-id')
					};
				});
				assert.ok(box.left >= 0 && box.right <= box.vw, `panel inside viewport: ${box.left}..${box.right}`);
				if (mobile) {
					assert.equal(Math.round(box.bottom), box.vh, 'sheet sits on the bottom edge');
					assert.equal(Math.round(box.right - box.left), box.vw, 'sheet spans the width');
				}
				assert.ok(box.truncated, 'long title ellipsises');
				assert.ok(box.titleInside, 'title stays inside the panel');
				assert.ok(box.bodyOverflowX <= 0, `no horizontal overflow (${box.bodyOverflowX}px)`);
				assert.equal(box.focused, 'a1');
				if (SHOTS) {
					await mkdir(SHOTS, { recursive: true });
					await page.screenshot({ path: `${SHOTS}/nc-${width}-${theme}.png` });
				}

				await page.keyboard.press('Escape');
				await page.waitForTimeout(450);
				assert.equal(await bell.getAttribute('aria-expanded'), 'false');
				assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-haspopup')), 'dialog');

				await page.setContent(
					`<!doctype html><html data-theme="${theme === 'light' ? 'light' : ''}"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${styles}</style></head><body style="padding:16px"></body></html>`
				);
				await page.addScriptTag({ content: bundle });
				await mountCenter(page, { items: [] });
				const emptyBell = page.locator('[data-tsu="NotificationCenter"] [aria-haspopup="dialog"]');
				assert.equal(await page.locator('.pop-count, .btn-count').count(), 0);
				await emptyBell.click();
				await page.waitForTimeout(450);
				const empty = page.locator('.nc-body [data-tsu="EmptyState"]');
				assert.ok(await empty.isVisible());
				assert.match((await empty.textContent()) ?? '', /No notifications/);
				if (SHOTS) await page.screenshot({ path: `${SHOTS}/nc-${width}-${theme}-empty.png` });
			} finally {
				await instance.close();
			}
		});
