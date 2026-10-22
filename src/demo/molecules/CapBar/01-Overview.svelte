<script module>
	export const meta = {
		title: 'Provider caps',
		caption: 'one row per provider: value, bind:cap, hint, an expected marker and onchange when the drag or arrow keys settle.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { CapBar, toasts } from '@dorsk/tsumikit';
	import { providers } from '../../fixtures';

	let caps = $state<Record<string, number | null>>(Object.fromEntries(providers.map((p) => [p.name, p.cap])));
</script>

<div class="rows">
	{#each providers as p (p.name)}
		<CapBar
			label={p.name}
			value={p.usedPct}
			bind:cap={caps[p.name]}
			hint="resets {p.resetsIn}"
			marker={p.expectedPct ?? null}
			markerLabel={p.expectedPct ? 'expected by now' : undefined}
			markerTone="warn"
			clearAtMax
			onchange={(c) => toasts.show(`${p.name} cap ${c === null ? 'removed' : `set to ${c}%`}`)}
		/>
	{/each}
</div>

<style>
	.rows {
		display: grid;
		gap: var(--sp-3);
	}
</style>
