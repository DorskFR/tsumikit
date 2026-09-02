<script lang="ts">
	// Copy-to-clipboard button. Composes the Button atom; copies `text` via the
	// async Clipboard API (with a hidden-textarea fallback for non-secure
	// contexts), then flips to a transient "copied" state (check icon + label)
	// that resets after `resetMs`. A visually-hidden aria-live region announces
	// the result for screen readers. Dependency-free.
	import Button from '$lib/components/atoms/Button.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import { copyToClipboard } from '$lib/clipboard';

	let {
		text,
		label = 'Copy',
		copiedLabel = 'Copied',
		variant = 'ghost',
		showLabel,
		box,
		hitArea = 'auto',
		resetMs = 1500,
		class: klass = ''
	}: {
		/** The string to copy. */
		text: string;
		label?: string;
		copiedLabel?: string;
		variant?: 'default' | 'primary' | 'ghost' | 'danger';
		/** Defaults to true, or false when `box` makes it icon-only. */
		showLabel?: boolean;
		/** Shared square box scale (`--box-xs/sm/md/lg`): a square icon-only copy control. */
		box?: 'xs' | 'sm' | 'md' | 'lg';
		hitArea?: 'auto' | 'compact';
		resetMs?: number;
		class?: string;
	} = $props();

	const labelShown = $derived(showLabel ?? box === undefined);
	let copied = $state(false);
	let status = $state('');
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		const ok = await copyToClipboard(text);
		copied = ok;
		status = ok ? copiedLabel : 'Copy failed';
		clearTimeout(timer);
		timer = setTimeout(() => {
			copied = false;
			status = '';
		}, resetMs);
	}
</script>

<Button
	data-tsu="CopyButton"
	{variant}
	{box}
	{hitArea}
	class={klass}
	onclick={copy}
	aria-label={copied ? copiedLabel : label}
	title={label}
>
	<Icon name={copied ? 'check' : 'copy'} />
	{#if labelShown}<span>{copied ? copiedLabel : label}</span>{/if}
</Button>
<span class="sr-only" role="status" aria-live="polite">{status}</span>
