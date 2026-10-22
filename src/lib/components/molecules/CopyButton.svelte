<script lang="ts">
	// Copy-to-clipboard button. Composes the Button atom; copies `text` via the
	// async Clipboard API (with a hidden-textarea fallback for non-secure
	// contexts), then flips to a transient "copied" state (check icon + label)
	// that resets after `resetMs`. A visually-hidden aria-live region announces
	// the result for screen readers. Dependency-free.
	import Button from '$lib/components/atoms/Button.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import { copyToClipboard } from '$lib/clipboard';
	import { playSound } from '$lib/sound';

	let {
		text,
		label = 'Copy',
		copiedLabel = 'Copied',
		variant = 'ghost',
		showLabel,
		box,
		hitArea = 'auto',
		resetMs = 1500,
		sound = true,
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
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
		class?: string;
	} = $props();

	const labelShown = $derived(showLabel ?? box === undefined);
	let copied = $state(false);
	let status = $state('');
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		const ok = await copyToClipboard(text);
		playSound(ok ? 'success' : 'error', sound);
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
	class="copy-btn {labelShown && box !== undefined ? 'copy-labelled' : ''} {klass}"
	sound={false}
	onclick={copy}
	aria-label={copied ? copiedLabel : label}
	title={label}
>
	<span class="glyphs" class:copied aria-hidden="true">
		<span class="glyph copy"><Icon name="copy" /></span>
		<span class="glyph check"><Icon name="check" /></span>
	</span>
	{#if labelShown}<span>{copied ? copiedLabel : label}</span>{/if}
</Button>
<span class="sr-only" role="status" aria-live="polite">{status}</span>

<style>
	/* Both glyphs share one grid cell so the swap never changes the width. The
	   check springs in (the kit's one bounce: a rare confirmation); the copy
	   glyph fades out fast and back in over the base duration on revert. */
	:global(.copy-btn.btn-box.copy-labelled) {
		width: auto;
		padding-inline: var(--sp-2);
	}
	.glyphs {
		display: inline-grid;
		place-items: center;
	}
	.glyph {
		grid-area: 1 / 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: opacity var(--dur-fast) ease;
	}
	.check {
		opacity: 0;
		scale: 0.6;
		transition:
			opacity var(--dur-fast) ease,
			scale var(--dur-fast) var(--ease-out);
	}
	.copied .copy {
		opacity: 0;
		transition-duration: var(--dur-exit-fast);
	}
	.copied .check {
		opacity: 1;
		scale: 1;
		transition:
			opacity var(--dur-spring-bounce) ease,
			scale var(--dur-spring-bounce) var(--ease-spring-bounce);
	}
</style>
