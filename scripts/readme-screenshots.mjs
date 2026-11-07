#!/usr/bin/env node
/**
 * Captures the README hero from the /looks showcase in a light and a dark theme.
 *
 * Usage: start the demo (`npm run dev -- --port 5391`), then
 *   npm run readme:shots [-- --url http://localhost:5391]
 */
import { mkdir } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';

const { values } = parseArgs({
	options: {
		url: { type: 'string', default: 'http://localhost:5391' },
		out: { type: 'string', default: 'docs/assets' },
	},
});

const VIEWPORT = { width: 1280, height: 1400 };
const SCALE = 2;
const SHOTS = [
	{ theme: 'light', file: 'hero-light.png' },
	{ theme: 'dark', file: 'hero-dark.png' },
];

await mkdir(values.out, { recursive: true });
const browser = await chromium.launch();
try {
	for (const shot of SHOTS) {
		const page = await browser.newPage({
			viewport: VIEWPORT,
			deviceScaleFactor: SCALE,
			colorScheme: shot.theme === 'dark' ? 'dark' : 'light',
			reducedMotion: 'reduce',
		});
		await page.goto(`${values.url}/looks?look=default&theme=${shot.theme}`, { waitUntil: 'networkidle' });
		await page.evaluate(() => document.fonts.ready);
		await page.addStyleTag({ content: 'vite-error-overlay, [data-sveltekit-dev-overlay] { display: none !important; }' });
		await page.mouse.move(0, 0);
		const bottom = await page.evaluate(() => {
			const block = document.querySelector('main .two') ?? document.querySelector('.two');
			return block ? Math.ceil(block.getBoundingClientRect().bottom) + 32 : 1300;
		});
		await page.screenshot({ path: `${values.out}/${shot.file}`, clip: { x: 0, y: 0, width: VIEWPORT.width, height: bottom } });
		await page.close();
		console.log(`${values.out}/${shot.file}`);
	}
} finally {
	await browser.close();
}
