<script lang="ts" module>
	export type SpinnerVariant =
		| 'icon'
		| 'arc'
		| 'dots'
		| 'orbit'
		| 'pulse'
		| 'bars'
		| 'grid'
		| 'clock'
		| 'bounce';

	// Inner spans per variant; `.in` wraps the flex/grid ones in an absolute
	// layer so the root keeps the same inline baseline as the others.
	const PARTS: Record<Exclude<SpinnerVariant, 'icon'>, { count: number; wrap: boolean }> = {
		arc: { count: 0, wrap: false },
		dots: { count: 3, wrap: true },
		orbit: { count: 2, wrap: false },
		pulse: { count: 1, wrap: false },
		bars: { count: 4, wrap: true },
		grid: { count: 9, wrap: true },
		clock: { count: 0, wrap: false },
		bounce: { count: 2, wrap: false }
	};
</script>

<script lang="ts">
	// Inline loading indicator. `icon` (default) spins the `loader` glyph; the
	// other variants are pure-CSS pictograms drawn in currentColor inside a 1em
	// box. Every variant's base style is a meaningful static pose, which is what
	// shows under prefers-reduced-motion. `--spinner-speed` scales the tempo.
	// `clock` and `bounce` read best at 20px and up.
	import Icon from './Icon.svelte';

	let {
		variant = 'icon',
		size,
		label = 'Loading',
		class: klass = '',
		style: styleProp = '',
		...rest
	}: {
		variant?: SpinnerVariant;
		/** Explicit pixel size. Omit to track the surrounding text (1em). */
		size?: number;
		/** AT label announcing the busy state. Set to undefined to make the
		 *  spinner decorative when an ancestor already conveys the loading state. */
		label?: string;
		class?: string;
		style?: string;
		[key: string]: unknown;
	} = $props();

	const parts = $derived(variant === 'icon' ? undefined : PARTS[variant]);
</script>

{#if !parts}
	<Icon name="loader" spin {size} {label} data-tsu="Spinner" class={klass} style={styleProp} {...rest} />
{:else}
	<span
		data-tsu="Spinner"
		class="spinner v-{variant} {klass}"
		style="{size ? `font-size: ${size}px;` : ''}{styleProp}"
		role={label ? 'img' : undefined}
		aria-label={label}
		aria-hidden={label ? undefined : 'true'}
		{...rest}
	>
		{#if parts.wrap}
			<span class="in">
				{#each { length: parts.count } as _, i (i)}<span></span>{/each}
			</span>
		{:else}
			{#each { length: parts.count } as _, i (i)}<span></span>{/each}
		{/if}
	</span>
{/if}

<style>
	@property --tsu-spin-arc {
		syntax: '<angle>';
		inherits: false;
		initial-value: 100deg;
	}

	.spinner {
		--sw: max(1.5px, 0.11em);
		--t: calc(1s * var(--spinner-speed, 1));
		position: relative;
		display: inline-block;
		flex: none;
		width: 1em;
		height: 1em;
		vertical-align: -0.125em;
		color: inherit;
	}
	.spinner span,
	.spinner::before,
	.spinner::after {
		box-sizing: border-box;
	}
	.in {
		position: absolute;
		inset: 0;
	}

	.v-arc::before,
	.v-arc::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: currentColor;
		-webkit-mask: radial-gradient(
			farthest-side,
			transparent calc(100% - var(--sw)),
			#000 calc(100% - var(--sw) + 0.5px)
		);
		mask: radial-gradient(
			farthest-side,
			transparent calc(100% - var(--sw)),
			#000 calc(100% - var(--sw) + 0.5px)
		);
	}
	.v-arc::before {
		opacity: 0.18;
	}
	.v-arc::after {
		--tsu-spin-arc: 100deg;
		-webkit-mask:
			radial-gradient(farthest-side, transparent calc(100% - var(--sw)), #000 calc(100% - var(--sw) + 0.5px)),
			conic-gradient(#000 var(--tsu-spin-arc), transparent 0);
		-webkit-mask-composite: source-in;
		mask:
			radial-gradient(farthest-side, transparent calc(100% - var(--sw)), #000 calc(100% - var(--sw) + 0.5px))
				intersect,
			conic-gradient(#000 var(--tsu-spin-arc), transparent 0);
		animation:
			tsu-spin-arc calc(var(--t) * 1.4) cubic-bezier(0.5, 0, 0.5, 1) infinite,
			tsu-spin-rot calc(var(--t) * 1.4) linear infinite;
	}
	@keyframes tsu-spin-arc {
		0% {
			--tsu-spin-arc: 20deg;
		}
		50% {
			--tsu-spin-arc: 280deg;
		}
		100% {
			--tsu-spin-arc: 20deg;
		}
	}
	@keyframes tsu-spin-rot {
		0% {
			transform: rotate(0deg);
		}
		50% {
			transform: rotate(160deg);
		}
		100% {
			transform: rotate(720deg);
		}
	}

	.v-dots .in {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 0.04em;
	}
	.v-dots .in span {
		width: 0.24em;
		height: 0.24em;
		border-radius: 50%;
		background: currentColor;
		animation: tsu-spin-dot calc(var(--t) * 1.1) cubic-bezier(0.45, 0, 0.55, 1) infinite;
	}
	.v-dots .in span:nth-child(1) {
		opacity: 1;
	}
	.v-dots .in span:nth-child(2) {
		opacity: 0.6;
		animation-delay: calc(var(--t) * 0.14);
	}
	.v-dots .in span:nth-child(3) {
		opacity: 0.32;
		animation-delay: calc(var(--t) * 0.28);
	}
	@keyframes tsu-spin-dot {
		0%,
		60%,
		100% {
			transform: translateY(0);
			opacity: 0.32;
		}
		25% {
			transform: translateY(-0.22em);
			opacity: 1;
		}
	}

	.v-orbit::before {
		content: '';
		position: absolute;
		inset: 0.08em;
		border-radius: 50%;
		border: max(1px, 0.06em) solid currentColor;
		opacity: 0.22;
	}
	.v-orbit > span:nth-child(1) {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 0.3em;
		height: 0.3em;
		margin: -0.15em;
		border-radius: 50%;
		background: currentColor;
		animation: tsu-spin-core calc(var(--t) * 1.2) ease-in-out infinite;
	}
	.v-orbit > span:nth-child(2) {
		position: absolute;
		inset: 0;
		transform: rotate(45deg);
		animation: tsu-spin-orbit calc(var(--t) * 1.2) cubic-bezier(0.6, 0.15, 0.4, 0.85) infinite;
	}
	.v-orbit > span:nth-child(2)::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 0;
		width: 0.24em;
		height: 0.24em;
		margin-left: -0.12em;
		border-radius: 50%;
		background: currentColor;
	}
	@keyframes tsu-spin-orbit {
		from {
			transform: rotate(45deg);
		}
		to {
			transform: rotate(405deg);
		}
	}
	@keyframes tsu-spin-core {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(0.7);
		}
	}

	.v-pulse > span {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 0.3em;
		height: 0.3em;
		margin: -0.15em;
		border-radius: 50%;
		background: currentColor;
	}
	.v-pulse::before,
	.v-pulse::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		border: var(--sw) solid currentColor;
		transform: scale(0.72);
		opacity: 0.45;
		animation: tsu-spin-ripple calc(var(--t) * 1.6) cubic-bezier(0.2, 0.6, 0.35, 1) infinite;
	}
	.v-pulse::after {
		animation-delay: calc(var(--t) * -0.8);
	}
	@keyframes tsu-spin-ripple {
		0% {
			transform: scale(0.3);
			opacity: 1;
		}
		100% {
			transform: scale(1);
			opacity: 0;
		}
	}

	.v-bars .in {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.06em 0.08em;
	}
	.v-bars .in span {
		width: 0.13em;
		height: 100%;
		border-radius: 0.1em;
		background: currentColor;
		transform-origin: 50% 50%;
		animation: tsu-spin-bar var(--t) ease-in-out infinite;
	}
	.v-bars .in span:nth-child(1) {
		transform: scaleY(0.4);
		animation-delay: calc(var(--t) * -0.9);
	}
	.v-bars .in span:nth-child(2) {
		transform: scaleY(0.85);
		animation-delay: calc(var(--t) * -0.6);
	}
	.v-bars .in span:nth-child(3) {
		transform: scaleY(0.6);
		animation-delay: calc(var(--t) * -0.3);
	}
	.v-bars .in span:nth-child(4) {
		transform: scaleY(1);
		animation-delay: calc(var(--t) * -0.75);
	}
	@keyframes tsu-spin-bar {
		0%,
		100% {
			transform: scaleY(0.3);
		}
		50% {
			transform: scaleY(1);
		}
	}

	.v-grid .in {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		place-items: center;
		padding: 0.04em;
	}
	.v-grid .in span {
		width: 0.2em;
		height: 0.2em;
		border-radius: 0.05em;
		background: currentColor;
		opacity: calc(1 - var(--d) * 0.18);
		animation: tsu-spin-cell calc(var(--t) * 1.2) ease-in-out infinite;
		animation-delay: calc(var(--t) * 0.1 * var(--d) - var(--t) * 1.2);
	}
	.v-grid .in span:nth-child(1) {
		--d: 0;
	}
	.v-grid .in span:nth-child(2),
	.v-grid .in span:nth-child(4) {
		--d: 1;
	}
	.v-grid .in span:nth-child(3),
	.v-grid .in span:nth-child(5),
	.v-grid .in span:nth-child(7) {
		--d: 2;
	}
	.v-grid .in span:nth-child(6),
	.v-grid .in span:nth-child(8) {
		--d: 3;
	}
	.v-grid .in span:nth-child(9) {
		--d: 4;
	}
	@keyframes tsu-spin-cell {
		0%,
		100% {
			opacity: 0.2;
			transform: scale(0.7);
		}
		35% {
			opacity: 1;
			transform: scale(1);
		}
	}

	.v-clock {
		border-radius: 50%;
		border: var(--sw) solid currentColor;
	}
	.v-clock::before,
	.v-clock::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: 50%;
		width: var(--sw);
		margin-left: calc(var(--sw) / -2);
		border-radius: var(--sw);
		background: currentColor;
		transform-origin: 50% 100%;
		translate: 0 calc(var(--sw) / 2);
	}
	.v-clock::before {
		height: 0.32em;
		transform: rotate(0deg);
		animation: tsu-spin-hand-m var(--t) linear infinite;
	}
	.v-clock::after {
		height: 0.22em;
		transform: rotate(90deg);
		animation: tsu-spin-hand-h calc(var(--t) * 12) linear infinite;
	}
	@keyframes tsu-spin-hand-m {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes tsu-spin-hand-h {
		from {
			transform: rotate(90deg);
		}
		to {
			transform: rotate(450deg);
		}
	}

	.v-bounce > span:nth-child(1) {
		position: absolute;
		left: 50%;
		bottom: 0.16em;
		width: 0.34em;
		height: 0.34em;
		margin-left: -0.17em;
		border-radius: 50%;
		background: currentColor;
		transform-origin: 50% 100%;
		animation: tsu-spin-ball calc(var(--t) * 0.9) infinite;
	}
	.v-bounce > span:nth-child(2) {
		position: absolute;
		left: 50%;
		bottom: 0.06em;
		width: 0.46em;
		height: 0.08em;
		margin-left: -0.23em;
		border-radius: 50%;
		background: currentColor;
		opacity: 0.3;
		animation: tsu-spin-shadow calc(var(--t) * 0.9) infinite;
	}
	@keyframes tsu-spin-ball {
		0% {
			transform: translateY(0) scale(1.18, 0.82);
			animation-timing-function: cubic-bezier(0.2, 0.7, 0.4, 1);
		}
		12% {
			transform: translateY(0) scale(1, 1);
			animation-timing-function: cubic-bezier(0.2, 0.7, 0.4, 1);
		}
		50% {
			transform: translateY(-0.5em) scale(0.95, 1.05);
			animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.3);
		}
		100% {
			transform: translateY(0) scale(1.18, 0.82);
		}
	}
	@keyframes tsu-spin-shadow {
		0%,
		100% {
			transform: scaleX(1);
			opacity: 0.35;
		}
		50% {
			transform: scaleX(0.5);
			opacity: 0.12;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner.spinner,
		.spinner.spinner span,
		.spinner.spinner::before,
		.spinner.spinner::after {
			animation: none;
		}
	}
</style>
