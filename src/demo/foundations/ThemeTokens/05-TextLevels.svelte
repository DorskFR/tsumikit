<script module>
	export const meta = {
		title: 'Text levels',
		caption: 'Three levels per theme: --text for titles and values, --text-muted for labels and secondary text (at least 4.5:1), --text-faint only for WCAG-exempt text such as placeholders, disabled controls and separator glyphs (about 3:1, visibly quieter than muted).',
		layout: 'row'
	};
</script>

<script lang="ts">
	import { THEMES } from '@dorsk/tsumikit';
</script>

{#each THEMES as t (t.id)}
	<div class="levels" data-theme={t.id} aria-label={t.label}>
		<span class="name">{t.label}</span>
		<span class="text">Value 1,284</span>
		<span class="muted">Label · secondary</span>
		<span class="faint">Placeholder</span>
	</div>
{/each}

<style>
	.levels {
		display: flex;
		flex-direction: column;
		gap: var(--sp-0-5);
		min-width: 10rem;
		padding: var(--sp-3);
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		background: var(--bg);
		font-size: var(--fs-sm);
	}
	.name {
		font-size: var(--fs-xs);
		font-weight: var(--fw-semibold);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}
	.text {
		font-weight: var(--fw-semibold);
		color: var(--text);
	}
	.muted {
		color: var(--text-muted);
	}
	.faint {
		color: var(--text-faint);
	}
</style>
