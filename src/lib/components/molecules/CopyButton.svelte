<script lang="ts">
	// Copy-to-clipboard button. Composes the Button atom; copies `text` via the
	// async Clipboard API (with a hidden-textarea fallback for non-secure
	// contexts), then flips to a transient "copied" state (check icon + label)
	// that resets after `resetMs`. A visually-hidden aria-live region announces
	// the result for screen readers. Dependency-free.
	import Button from '$lib/components/atoms/Button.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';

	let {
		text,
		label = 'Copy',
		copiedLabel = 'Copied',
		variant = 'ghost',
		showLabel = true,
		resetMs = 1500,
		class: klass = ''
	}: {
		/** The string to copy. */
		text: string;
		label?: string;
		copiedLabel?: string;
		variant?: 'default' | 'primary' | 'ghost' | 'danger';
		showLabel?: boolean;
		resetMs?: number;
		class?: string;
	} = $props();

	let copied = $state(false);
	let status = $state('');
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		const ok = await writeClipboard(text);
		copied = ok;
		status = ok ? copiedLabel : 'Copy failed';
		clearTimeout(timer);
		timer = setTimeout(() => {
			copied = false;
			status = '';
		}, resetMs);
	}

	async function writeClipboard(value: string): Promise<boolean> {
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(value);
				return true;
			}
		} catch {
			/* fall through to legacy path */
		}
		// Fallback for insecure contexts / older browsers.
		try {
			const ta = document.createElement('textarea');
			ta.value = value;
			ta.style.position = 'fixed';
			ta.style.opacity = '0';
			document.body.appendChild(ta);
			ta.select();
			const ok = document.execCommand('copy');
			document.body.removeChild(ta);
			return ok;
		} catch {
			return false;
		}
	}
</script>

<Button
	{variant}
	class={klass}
	onclick={copy}
	aria-label={copied ? copiedLabel : label}
	title={label}
>
	<Icon name={copied ? 'check' : 'copy'} />
	{#if showLabel}<span>{copied ? copiedLabel : label}</span>{/if}
</Button>
<span class="sr-only" role="status" aria-live="polite">{status}</span>
