<script lang="ts">
	// A timestamp you can read five ways and inspect in one place. Inline it
	// renders in the chosen `mode` (date / time / datetime / relative / iso),
	// in the viewer's zone or UTC via the `utc` flag; by default clicking it
	// opens a popover that lays out the same instant as ISO-UTC, local, relative,
	// the IANA zone and the unix epoch — so the one value answers "when,
	// exactly?" without leaving the row. The popover is read-only
	// unless you opt into `selectable`, which adds buttons to switch the inline
	// display mode (handy in a demo / settings surface, rarely in a data row).
	//
	// All formatting is delegated to the pure helpers in `$lib/timestamp`; this
	// component owns only the mode state, the live tick for relative mode, and
	// the popover chrome. The trigger is a real <time datetime> element for
	// machine-readability and a11y.
	import Popover from './Popover.svelte';
	import {
		formatTimestamp,
		localTimeZone,
		relativeTime,
		toDate,
		toEpochSeconds,
		toISO,
		toLocale,
		type TimeInput,
		type TimestampMode
	} from '$lib/timestamp';

	type Tone = 'inherit' | 'default' | 'muted' | 'faint' | 'danger' | 'accent';
	type Size = 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl';

	let {
		value,
		mode = 'datetime',
		utc = false,
		details = true,
		selectable = false,
		mono = false,
		tone = 'muted',
		size,
		tickMs = 30_000
	}: {
		/** The instant: a Date, epoch milliseconds, or an ISO/parseable string.
		 *  null/undefined (or unparseable input) renders an inert "—". */
		value: TimeInput | null | undefined;
		/** Inline display mode. Default 'datetime'. */
		mode?: TimestampMode;
		/** Render the date/time/datetime modes in UTC rather than the viewer's
		 *  zone. Default false. Ignored by 'iso' (always UTC) and 'relative'
		 *  (zoneless). Handy for calendar-date fields, where a local midnight-UTC
		 *  value would otherwise show the wrong day. */
		utc?: boolean;
		/** Click to open the details popover (UTC / local / relative / zone /
		 *  epoch). Default true. When false, renders as a bare inline <time>. */
		details?: boolean;
		/** Add mode-switch buttons inside the popover so the viewer can change the
		 *  inline display mode. Default false. Implies `details`. */
		selectable?: boolean;
		/** Render in the monospace font (tabular figures stay on regardless). */
		mono?: boolean;
		/** Text colour, mirroring <Text> tones. Default 'muted' — timestamps read
		 *  as subdued metadata; pass 'inherit' to blend with surrounding copy. */
		tone?: Tone;
		/** Font size, mirroring <Text> sizes (maps to --fs-* tokens). Omit to
		 *  inherit the surrounding size. */
		size?: Size;
		/** How often relative mode re-renders so "3m ago" stays fresh. */
		tickMs?: number;
	} = $props();

	// User's in-popover choice overrides the `mode` prop; until they pick, we
	// follow the prop (so a parent can still drive it reactively). Deriving —
	// rather than seeding $state from a prop — keeps both behaviours and avoids
	// capturing only the prop's initial value.
	let override = $state<TimestampMode | null>(null);
	const current = $derived(override ?? mode);
	// Live clock for relative mode only — a single timer that exists solely while
	// relative is on screen, so static modes cost nothing.
	let now = $state(Date.now());
	$effect(() => {
		if (current !== 'relative') return;
		const t = setInterval(() => (now = Date.now()), tickMs);
		return () => clearInterval(t);
	});

	const date = $derived(toDate(value));
	const label = $derived(formatTimestamp(value, current, now, utc));
	// datetime= wants a valid ISO string; omit it entirely on bad input.
	const machine = $derived(date ? toISO(date) : undefined);
	const showPopover = $derived(details || selectable);
	const cls = $derived(`ts tone-${tone}${mono ? ' mono' : ''}`);
	// Size maps straight onto the --fs-* scale; null leaves font-size unset so the
	// timestamp inherits its surrounding run.
	const sizeVar = $derived(size ? `var(--fs-${size})` : null);

	const MODES: { id: TimestampMode; name: string }[] = [
		{ id: 'date', name: 'Date' },
		{ id: 'time', name: 'Time' },
		{ id: 'datetime', name: 'Date+time' },
		{ id: 'relative', name: 'Relative' },
		{ id: 'iso', name: 'ISO' }
	];

	const rows = $derived(
		date
			? [
					{ k: 'UTC', v: toISO(date) },
					{ k: 'Local', v: toLocale(date, 'datetime') },
					{ k: 'Relative', v: relativeTime(date, now) },
					{ k: 'Time zone', v: localTimeZone() },
					{ k: 'Unix', v: String(toEpochSeconds(date)) }
				]
			: []
	);
</script>

{#if !date}
	<!-- Unparseable input: degrade to an inert dash rather than empty text. -->
	<time class="{cls} ts-invalid" data-tsu="Timestamp" style:font-size={sizeVar}>—</time>
{:else if showPopover}
	<Popover label="Timestamp details" placement="bottom-start" bare>
		{#snippet trigger()}
			<time class="{cls} ts-trigger" data-tsu="Timestamp" style:font-size={sizeVar} datetime={machine}>{label}</time>
		{/snippet}
		<div class="ts-panel">
			{#if selectable}
				<div class="ts-modes" role="group" aria-label="Display mode">
					{#each MODES as m (m.id)}
						<button
							type="button"
							class="ts-mode"
							class:active={current === m.id}
							aria-pressed={current === m.id}
							onclick={() => (override = m.id)}
						>
							{m.name}
						</button>
					{/each}
				</div>
			{/if}
			<dl class="ts-details">
				{#each rows as row (row.k)}
					<dt>{row.k}</dt>
					<dd>{row.v}</dd>
				{/each}
			</dl>
		</div>
	</Popover>
{:else}
	<time class={cls} data-tsu="Timestamp" style:font-size={sizeVar} datetime={machine}>{label}</time>
{/if}

<style>
	.ts {
		font-variant-numeric: tabular-nums;
	}
	.mono {
		font-family: var(--font-mono);
	}
	/* Tones mirror <Text>; 'inherit' deliberately sets no colour so the timestamp
	   blends into surrounding copy. */
	.tone-default {
		color: var(--text);
	}
	.tone-muted {
		color: var(--text-muted);
	}
	.tone-faint {
		color: var(--text-faint);
	}
	.tone-danger {
		color: var(--danger);
	}
	.tone-accent {
		color: var(--accent);
	}
	.ts-invalid {
		color: var(--text-muted);
	}
	/* The popover trigger is a plain inline run of text that hints it's clickable
	   — no button chrome (we pass `bare`), just an underline on hover/focus. */
	.ts-trigger {
		cursor: pointer;
		border-radius: var(--r-sm);
		text-decoration-line: underline;
		text-decoration-style: dotted;
		text-underline-offset: 2px;
		text-decoration-color: var(--border-strong);
	}
	.ts-trigger:hover,
	.ts-trigger:focus-visible {
		text-decoration-color: currentColor;
	}

	.ts-panel {
		display: flex;
		flex-direction: column;
		gap: var(--sp-2);
		padding: var(--sp-1);
	}
	.ts-modes {
		display: flex;
		gap: var(--sp-1);
	}
	.ts-mode {
		flex: 1;
		padding: var(--sp-1) var(--sp-2);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--text-muted);
		font-size: var(--fs-xs);
		cursor: pointer;
		transition:
			background 0.12s var(--ease),
			color 0.12s var(--ease);
	}
	.ts-mode:hover {
		background: var(--bg-elevated-2);
		color: var(--text);
	}
	.ts-mode.active {
		background: var(--bg-elevated-2);
		color: var(--text);
		border-color: var(--text);
	}
	.ts-details {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--sp-1) var(--sp-2);
		margin: 0;
		font-size: var(--fs-xs);
	}
	.ts-details dt {
		color: var(--text-muted);
		white-space: nowrap;
	}
	.ts-details dd {
		margin: 0;
		color: var(--text);
		font-variant-numeric: tabular-nums;
		overflow-wrap: anywhere;
	}
</style>
