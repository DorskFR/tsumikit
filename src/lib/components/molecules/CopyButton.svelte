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
	let run = $state(0);
	let status = $state('');
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		const ok = await copyToClipboard(text);
		playSound(ok ? 'success' : 'error', sound);
		copied = ok;
		if (ok) run++;
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
	data-copied={copied || undefined}
	aria-label={copied ? copiedLabel : label}
	title={label}
>
	<span class="glyphs" class:copied class:tinted={variant === 'ghost' || variant === 'default'} aria-hidden="true">
		<span class="glyph copy"><Icon name="copy" /></span>
		<span class="glyph check"><Icon name="check" /></span>
		<svg class="glyph tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
			<path d="M4.5 12.5l5 5L19.5 7" pathLength="1" />
		</svg>
		{#key run}<span class="sparks"></span>{/key}
	</span>
	{#if labelShown}
		<span class="words" class:copied aria-hidden="true"><span class="word idle">{label}</span><span class="word done">{copiedLabel}</span></span>
	{/if}
</Button>
<span class="sr-only" role="status" aria-live="polite">{status}</span>

<style>
	/* Both glyphs share one grid cell and both words another, so the swap never
	   changes the width. */
	:global(.copy-btn.btn-box.copy-labelled) {
		width: auto;
		padding-inline: var(--sp-2);
	}
	.glyphs {
		position: relative;
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
	.tick,
	.sparks {
		display: none;
	}
	.words {
		display: inline-grid;
		overflow: hidden;
		text-align: start;
	}
	.word {
		grid-area: 1 / 1;
	}
	.done,
	.copied .idle {
		opacity: 0;
	}
	.copied .done {
		opacity: 1;
	}

	/* Morph burst: the check springs in on a turn inside a ring of eight sparks. */
	.glyphs:not(:global([data-fx-copy]:not([data-fx-copy='burst'])) *),
	:global([data-fx-copy='burst']) .glyphs:not(:global([data-fx-copy='burst'] [data-fx-copy]:not([data-fx-copy='burst'])) *) {
		& .check {
			scale: 0.4;
			rotate: 60deg;
			transition-property: opacity, scale, rotate;
			transition-duration: var(--dur-exit-fast);
			transition-timing-function: ease;
		}
		&.copied .check {
			scale: 1;
			rotate: 0deg;
			transition-duration: var(--dur-fast), var(--dur-spring), var(--dur-spring);
			transition-delay: calc(var(--dur-exit-fast) / 2);
			transition-timing-function: ease, var(--ease-spring-bounce), var(--ease-out);
		}
		& .sparks {
			--spark-a: color-mix(in srgb, var(--ok) 85%, transparent);
			--spark-b: color-mix(in srgb, var(--accent) 85%, transparent);
			position: absolute;
			inset: -9px;
			display: block;
			pointer-events: none;
			background:
				radial-gradient(circle at 50% 4%, var(--spark-a) 1.6px, transparent 2.2px),
				radial-gradient(circle at 83% 17%, var(--spark-b) 1.3px, transparent 1.9px),
				radial-gradient(circle at 96% 50%, var(--spark-a) 1.6px, transparent 2.2px),
				radial-gradient(circle at 83% 83%, var(--spark-b) 1.3px, transparent 1.9px),
				radial-gradient(circle at 50% 96%, var(--spark-a) 1.6px, transparent 2.2px),
				radial-gradient(circle at 17% 83%, var(--spark-b) 1.3px, transparent 1.9px),
				radial-gradient(circle at 4% 50%, var(--spark-a) 1.6px, transparent 2.2px),
				radial-gradient(circle at 17% 17%, var(--spark-b) 1.3px, transparent 1.9px);
			opacity: 0;
		}
		&.copied .sparks {
			animation: copy-burst calc(var(--dur-slow) + var(--dur-exit-fast)) var(--ease-out);
		}
	}
	@keyframes copy-burst {
		0% {
			opacity: 0;
			scale: 0.35;
			rotate: -20deg;
		}
		30% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			scale: 1.15;
			rotate: 0deg;
		}
	}

	/* Tick and slide: the tick draws itself while the label rolls up into its
	   copied form. */
	:global([data-fx-copy='tick']) .glyphs:not(:global([data-fx-copy='tick'] [data-fx-copy]:not([data-fx-copy='tick'])) *) {
		& .check {
			display: none;
		}
		& .tick {
			display: block;
			width: 1em;
			height: 1em;
		}
		& .tick path {
			stroke-dasharray: 1;
			stroke-dashoffset: 1;
			transition-property: opacity, stroke-dashoffset;
			transition-duration: var(--dur-exit-fast), var(--dur-instant);
			transition-delay: var(--dur-instant), var(--dur-exit-fast);
		}
		&.copied .tick path {
			stroke-dashoffset: 0;
			transition-duration: var(--dur-fast), var(--dur-slow);
			transition-delay: var(--dur-instant), calc(var(--dur-fast) / 2);
			transition-timing-function: ease, var(--ease-out);
		}
		& .copy {
			transition-property: opacity, scale;
			transition-duration: var(--dur-base), var(--dur-spring);
			transition-timing-function: ease, var(--ease-spring);
		}
		&.copied .copy {
			scale: 0.6;
			transition-duration: var(--dur-exit-fast), var(--dur-exit);
		}
	}
	:global([data-fx-copy='tick']) .words:not(:global([data-fx-copy='tick'] [data-fx-copy]:not([data-fx-copy='tick'])) *) {
		& .word {
			transition-property: opacity, translate;
			transition-duration: var(--dur-base), var(--dur-spring);
			transition-timing-function: ease, var(--ease-spring);
		}
		& .done {
			translate: 0 100%;
		}
		&.copied .idle {
			translate: 0 -100%;
			transition-duration: var(--dur-exit-fast), var(--dur-exit);
		}
		&.copied .done {
			translate: 0 0;
			transition-delay: calc(var(--dur-exit-fast) / 2);
		}
	}
	.tinted.copied :is(.check, .tick) {
		color: var(--ok);
	}
</style>
