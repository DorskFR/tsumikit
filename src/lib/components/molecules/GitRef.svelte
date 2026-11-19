<script lang="ts" module>
	import type { Tone } from '$lib/tone';

	export type PrState = 'open' | 'merged' | 'closed' | 'draft';

	export type PullRequest = {
		url: string;
		owner?: string;
		repo?: string;
		number: number;
		state?: PrState;
	};

	export type DiffStats = { additions: number; deletions: number };

	export const PR_TONE: Record<PrState, Tone> = {
		open: 'ok',
		merged: 'accent',
		closed: 'danger',
		draft: 'neutral',
	};

	export function prLabel(pr: PullRequest): string {
		return pr.owner && pr.repo ? `${pr.owner}/${pr.repo}#${pr.number}` : `#${pr.number}`;
	}
</script>

<script lang="ts">
	import Icon from '../atoms/Icon.svelte';

	let {
		branch,
		pr,
		diff,
		maxWidth = '14rem',
		collapse = 'auto',
		class: klass = '',
		...rest
	}: {
		branch?: string;
		pr?: PullRequest;
		diff?: DiffStats;
		/** Cap on the branch chip; the name truncates with an ellipsis past it. */
		maxWidth?: string;
		/** `auto` drops chip text below 18rem of the nearest `.cq` container,
		 *  `glyph` always shows icon-only; the full text stays in the tooltip. */
		collapse?: 'auto' | 'never' | 'glyph';
		class?: string;
		[key: string]: unknown;
	} = $props();

	const prTone = $derived(pr ? PR_TONE[pr.state ?? 'open'] : undefined);
	const label = $derived(pr ? prLabel(pr) : '');
	const prTitle = $derived(pr ? (pr.state ? `${label} · ${pr.state}` : label) : '');
</script>

{#snippet pullRequestGlyph()}
	<circle cx="5" cy="6" r="3" />
	<path d="M5 9v12" />
	<circle cx="19" cy="18" r="3" />
	<path d="m15 9-3-3 3-3" />
	<path d="M12 6h5a2 2 0 0 1 2 2v7" />
{/snippet}

{#if branch || pr || diff}
	<span
		data-tsu="GitRef"
		class="git-ref collapse-{collapse} {klass}"
		{...rest}
	>
		{#if branch}
			<span class="chip branch" style:max-width={maxWidth} title={branch}>
				<Icon name="fork" label="Branch" />
				<span class="text">{branch}</span>
			</span>
		{/if}
		{#if pr}
			<a
				class="chip pr tone-{prTone}"
				href={pr.url}
				target="_blank"
				rel="noopener noreferrer"
				title={prTitle}
			>
				<Icon label="Pull request">{@render pullRequestGlyph()}</Icon>
				<span class="text">{label}</span>
			</a>
		{/if}
		{#if diff}
			<span class="diff" title="+{diff.additions} −{diff.deletions}">
				<span class="add">+{diff.additions}</span>
				<span class="del">−{diff.deletions}</span>
			</span>
		{/if}
	</span>
{/if}

<style>
	.git-ref {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		min-width: 0;
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		line-height: var(--lh-snug);
		white-space: nowrap;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25em;
		min-width: 0;
		padding: var(--sp-0-5) var(--sp-2);
		border-radius: var(--r-pill);
		background: var(--surface-fill-2);
		color: var(--text-muted);
		border: var(--edge-width) solid var(--surface-edge);
		text-decoration: none;
	}
	.branch {
		max-width: 14rem;
	}
	.pr {
		transition: border-color var(--dur-fast) var(--ease);
	}
	.pr.tone-ok {
		color: var(--ok);
		border-color: color-mix(in srgb, var(--ok) 40%, transparent);
		background: color-mix(in srgb, var(--ok) 12%, transparent);
	}
	.pr.tone-accent {
		color: var(--accent);
		border-color: color-mix(in srgb, var(--accent) 40%, transparent);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}
	.pr.tone-danger {
		color: var(--danger);
		border-color: color-mix(in srgb, var(--danger) 40%, transparent);
		background: color-mix(in srgb, var(--danger) 12%, transparent);
	}
	.pr.tone-neutral {
		color: var(--text-muted);
		border-color: color-mix(in srgb, var(--text-muted) 40%, transparent);
		background: color-mix(in srgb, var(--text-muted) 12%, transparent);
	}
	@media (hover: hover) and (pointer: fine) {
		.pr.tone-ok:hover {
			border-color: var(--ok);
		}
		.pr.tone-accent:hover {
			border-color: var(--accent);
		}
		.pr.tone-danger:hover {
			border-color: var(--danger);
		}
		.pr.tone-neutral:hover {
			border-color: var(--text-muted);
		}
	}
	.pr:focus-visible {
		outline: var(--focus-ring-width) solid currentColor;
		outline-offset: var(--focus-ring-offset);
	}
	.text {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.diff {
		display: inline-flex;
		gap: 0.35em;
		font-variant-numeric: tabular-nums;
	}
	.add {
		color: var(--ok);
	}
	.del {
		color: var(--danger);
	}
	.collapse-glyph .text {
		display: none;
	}
	@container (max-width: 18rem) {
		.collapse-auto .text {
			display: none;
		}
	}
</style>
