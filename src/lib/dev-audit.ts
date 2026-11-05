export type DesignIssueKind =
	| 'multiple-primary'
	| 'unnamed-control'
	| 'small-target'
	| 'text-over-image';

export type DesignIssue = {
	kind: DesignIssueKind;
	el: Element;
	message: string;
};

export type DesignAuditOptions = {
	root?: ParentNode;
	/** Debounce window after a DOM mutation, in ms. */
	delay?: number;
	/** Minimum hit box, in px; defaults to the `--touch-target` token (44px). */
	touchTarget?: number;
	/** Treat the pointer as coarse regardless of the media query. */
	coarse?: boolean;
};

const PRIMARY = '[data-tsu="Button"].btn-primary';
const CONTROL = '[data-tsu="Button"], [data-tsu="IconButton"]';
const LANDMARK = 'dialog, [role="dialog"], [role="alertdialog"], main, [role="main"]';
const INTERACTIVE =
	'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [role="menuitem"], [role="option"], [role="slider"]';
const SCRIM = '[data-tsu="Scrim"], .scrim, [data-scrim]';

function view(el: Element): Window {
	return el.ownerDocument.defaultView ?? window;
}

function isVisible(el: Element): boolean {
	if (el.closest('[hidden], [inert]')) return false;
	const win = view(el);
	for (let node: Element | null = el; node; node = node.parentElement) {
		const style = win.getComputedStyle(node);
		if (style.display === 'none' || style.visibility === 'hidden') return false;
	}
	return true;
}

function isDisabled(el: Element): boolean {
	return el.matches(':disabled, [aria-disabled="true"]');
}

function ownText(el: Element): string {
	let out = '';
	for (const node of el.childNodes) {
		if (node.nodeType === 3) out += node.textContent ?? '';
		else if (
			node.nodeType === 1 &&
			!(node as Element).matches('[aria-hidden="true"], script, style')
		)
			out += ownText(node as Element);
	}
	return out;
}

function accessibleName(el: Element): string {
	const label = el.getAttribute('aria-label')?.trim();
	if (label) return label;
	const by = el.getAttribute('aria-labelledby');
	if (by) {
		const text = by
			.split(/\s+/)
			.map((id) => el.ownerDocument.getElementById(id)?.textContent?.trim() ?? '')
			.join(' ')
			.trim();
		if (text) return text;
	}
	const text = ownText(el).trim();
	if (text) return text;
	for (const child of el.querySelectorAll('img[alt], svg title, [aria-label]')) {
		const alt = child.getAttribute('alt') ?? child.getAttribute('aria-label') ?? child.textContent;
		if (alt?.trim()) return alt.trim();
	}
	return el.getAttribute('title')?.trim() ?? '';
}

function describe(el: Element): string {
	const tsu = el.getAttribute('data-tsu');
	return tsu ? `<${tsu}>` : `<${el.tagName.toLowerCase()}>`;
}

function landmarkOf(el: Element): Element {
	return el.closest(LANDMARK) ?? el.ownerDocument.body;
}

function landmarkName(el: Element): string {
	return el === el.ownerDocument.body
		? 'page'
		: el.matches('main, [role="main"]')
			? 'main'
			: 'dialog';
}

function readToken(root: ParentNode, name: string, fallback: number): number {
	const doc = root.ownerDocument ?? (root as Document);
	const raw = doc.defaultView?.getComputedStyle(doc.documentElement).getPropertyValue(name);
	const n = Number.parseFloat(raw ?? '');
	return Number.isFinite(n) && n > 0 ? n : fallback;
}

/* Kit controls are sized to --touch-target-compact by design (see tokens.css). */
function isKitControl(el: Element): boolean {
	return el.matches('[data-tsu], .btn');
}

/** Kit controls stretch their hit box with an absolutely positioned ::before/::after slab. */
function hasHitSlab(el: Element): boolean {
	const win = view(el);
	for (const pseudo of ['::before', '::after']) {
		const s = win.getComputedStyle(el, pseudo);
		if (s.position === 'absolute' && s.content && s.content !== 'none' && s.content !== 'normal')
			return true;
	}
	return false;
}

function hitBox(el: Element): DOMRect {
	const own = el.getBoundingClientRect();
	const label = el.closest('label');
	if (!label || label === el) return own;
	const lr = label.getBoundingClientRect();
	return lr.width * lr.height > own.width * own.height ? lr : own;
}

function hasOpaqueBackground(el: Element): boolean {
	const s = view(el).getComputedStyle(el);
	if (s.backgroundImage && s.backgroundImage !== 'none') return true;
	const bg = s.backgroundColor;
	return (
		!!bg && bg !== 'transparent' && !/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)$/.test(bg)
	);
}

function hasOwnText(el: Element): boolean {
	for (const node of el.childNodes)
		if (node.nodeType === 3 && node.textContent?.trim()) return true;
	return false;
}

function imageUnder(text: Element): Element | null {
	const artwork = text.closest('[data-tsu="Artwork"]');
	if (artwork) return text.matches('[data-tsu="Artwork"] > .initials') ? null : artwork;
	const win = view(text);
	let positioned = false;
	for (let node: Element | null = text; node; node = node.parentElement) {
		const pos = win.getComputedStyle(node).position;
		if (pos === 'absolute' || pos === 'fixed') positioned = true;
		if (!positioned) continue;
		if (pos !== 'static' && node !== text) {
			const img = node.querySelector('img, picture, video, [data-tsu="Artwork"]');
			if (img && !img.contains(text)) return node;
		}
	}
	return null;
}

function scrimmed(text: Element, container: Element): boolean {
	if (container.querySelector(SCRIM)) return true;
	for (let node: Element | null = text; node && node !== container; node = node.parentElement)
		if (hasOpaqueBackground(node)) return true;
	return false;
}

function coarsePointer(root: ParentNode): boolean {
	const win = (root.ownerDocument ?? (root as Document)).defaultView;
	return !!win?.matchMedia?.('(pointer: coarse)').matches;
}

export function auditDesign(options: DesignAuditOptions = {}): DesignIssue[] {
	if (typeof document === 'undefined' && !options.root) return [];
	const root = options.root ?? document;
	const issues: DesignIssue[] = [];

	const byLandmark = new Map<Element, Element[]>();
	for (const btn of root.querySelectorAll(PRIMARY)) {
		if (!isVisible(btn)) continue;
		const lm = landmarkOf(btn);
		const list = byLandmark.get(lm) ?? [];
		list.push(btn);
		byLandmark.set(lm, list);
	}
	for (const [lm, list] of byLandmark) {
		if (list.length < 2) continue;
		for (const el of list.slice(1))
			issues.push({
				kind: 'multiple-primary',
				el,
				message: `${list.length} primary Buttons visible in the same ${landmarkName(lm)}; keep one primary per view`,
			});
	}

	for (const el of root.querySelectorAll(CONTROL)) {
		if (accessibleName(el)) continue;
		issues.push({ kind: 'unnamed-control', el, message: `${describe(el)} has no accessible name` });
	}

	const coarse = options.coarse ?? coarsePointer(root);
	if (coarse) {
		const target = options.touchTarget ?? readToken(root, '--touch-target', 44);
		const compact = Math.min(target, readToken(root, '--touch-target-compact', 40));
		for (const el of root.querySelectorAll(INTERACTIVE)) {
			if (el.matches('.hit-compact, [tabindex="-1"]') || isDisabled(el) || !isVisible(el)) continue;
			const box = hitBox(el);
			if (box.width === 0 || box.height === 0) continue;
			const min = isKitControl(el) ? compact : target;
			if (box.width >= min && box.height >= min) continue;
			if (hasHitSlab(el)) continue;
			issues.push({
				kind: 'small-target',
				el,
				message: `${describe(el)} hit box is ${Math.round(box.width)}x${Math.round(box.height)}px, under the ${min}px touch target`,
			});
		}
	}

	for (const el of root.querySelectorAll('*')) {
		if (!hasOwnText(el) || el.closest('[aria-hidden="true"]')) continue;
		const container = imageUnder(el);
		if (!container || scrimmed(el, container)) continue;
		issues.push({
			kind: 'text-over-image',
			el,
			message: `${describe(el)} text sits on an image without a Scrim`,
		});
	}

	return issues;
}

const reported = new WeakMap<Element, Set<DesignIssueKind>>();

export function reportDesignIssues(issues: DesignIssue[]): DesignIssue[] {
	const fresh: DesignIssue[] = [];
	for (const issue of issues) {
		const seen = reported.get(issue.el) ?? new Set<DesignIssueKind>();
		if (seen.has(issue.kind)) continue;
		seen.add(issue.kind);
		reported.set(issue.el, seen);
		fresh.push(issue);
		console.warn(`[tsumikit] ${issue.message}`, issue.el);
	}
	return fresh;
}

let active: (() => void) | undefined;

/** Idempotent: a second call while running returns the same stop function. */
export function startDesignAudit(options: DesignAuditOptions = {}): () => void {
	if (!import.meta.env.DEV || typeof document === 'undefined') return () => {};
	if (active) return active;
	const root = options.root ?? document;
	const win = (root.ownerDocument ?? (root as Document)).defaultView ?? window;
	const delay = options.delay ?? 250;
	let timer: number | undefined;
	const run = () => {
		timer = undefined;
		reportDesignIssues(auditDesign(options));
	};
	const schedule = () => {
		if (timer !== undefined) win.clearTimeout(timer);
		timer = win.setTimeout(run, delay);
	};
	const observer = new win.MutationObserver(schedule);
	observer.observe(root === document ? document.documentElement : (root as Node), {
		subtree: true,
		childList: true,
		attributes: true,
		characterData: true,
	});
	schedule();
	active = () => {
		observer.disconnect();
		if (timer !== undefined) win.clearTimeout(timer);
		active = undefined;
	};
	return active;
}
