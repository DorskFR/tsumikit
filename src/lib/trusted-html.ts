import type { Attachment } from 'svelte/attachments';

export interface TrustedHTML {
	toString(): string;
}

export type HTMLValue = string | TrustedHTML;

/** Name of the Trusted Types policy tsumikit creates for HTML it builds itself.
 *  Allow it in CSP: `trusted-types tsumikit`. */
export const TRUSTED_TYPES_POLICY = 'tsumikit';

type Policy = { createHTML(input: string): TrustedHTML };
type TrustedTypesFactory = {
	createPolicy(name: string, rules: { createHTML(input: string): string }): Policy;
};

let policy: Policy | null | undefined;

/** Only for HTML that is safe by construction: the policy does not sanitize. */
export function libraryHTML(html: string): HTMLValue {
	if (policy === undefined) {
		const tt = (globalThis as { trustedTypes?: TrustedTypesFactory }).trustedTypes;
		try {
			policy = tt ? tt.createPolicy(TRUSTED_TYPES_POLICY, { createHTML: (s) => s }) : null;
		} catch {
			policy = null;
		}
	}
	return policy ? policy.createHTML(html) : html;
}

/** Opt-in sanitization for `Prose` / `CodeBlock` `html`. Uses
 *  `Element.setHTML(html, { sanitizer })` where the Sanitizer API exists, else
 *  `fallback(html)` (e.g. DOMPurify). With neither, the markup is shown as text. */
export type SanitizeOptions = {
	/** Passed to `setHTML`; omit for the browser's safe default. */
	sanitizer?: object;
	/** Used when `setHTML` is unavailable. Return `TrustedHTML` under Trusted Types enforcement. */
	fallback?: (html: string) => HTMLValue;
};

type SetHTML = (html: string, options?: { sanitizer?: object }) => void;

export function writeSanitized(node: Element, html: HTMLValue, opts: SanitizeOptions): void {
	const markup = String(html);
	const setHTML = (node as Element & { setHTML?: SetHTML }).setHTML;
	if (typeof setHTML === 'function') {
		setHTML.call(node, markup, opts.sanitizer ? { sanitizer: opts.sanitizer } : undefined);
	} else if (opts.fallback) {
		(node as { innerHTML: HTMLValue }).innerHTML = opts.fallback(markup);
	} else {
		node.textContent = markup;
	}
}

export function sanitizedHTML(html: HTMLValue, opts: SanitizeOptions): Attachment<Element> {
	return (node) => writeSanitized(node, html, opts);
}
