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

	const TONE_COLOR: Record<Tone, string> = {
		neutral: 'var(--text-muted)',
		ok: 'var(--ok)',
		success: 'var(--ok)',
		warn: 'var(--warn)',
		danger: 'var(--danger)',
		info: 'var(--info)',
		accent: 'var(--accent)',
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

	const prTone = $derived(pr ? TONE_COLOR[PR_TONE[pr.state ?? 'open']] : undefined);
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
		style:--git-ref-max-width={maxWidth}
		{...rest}
	>
		{#if branch}
			<span class="chip branch" title={branch}>
				<Icon name="fork" label="Branch" />
				<span class="text">{branch}</span>
			</span>
		{/if}
		{#if pr}
			<a
				class="chip pr"
				href={pr.url}
				target="_blank"
				rel="noopener noreferrer"
				title={prTitle}
				style:--git-ref-tone={prTone}
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
		line-height: 1.4;
		white-space: nowrap;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25em;
		min-width: 0;
		padding: 0.15rem var(--sp-2);
		border-radius: var(--r-pill);
		background: var(--bg-elevated-2);
		color: var(--text-muted);
		border: 1px solid var(--border);
		text-decoration: none;
	}
	.branch {
		max-width: var(--git-ref-max-width, 14rem);
	}
	.pr {
		color: var(--git-ref-tone);
		border-color: color-mix(in srgb, var(--git-ref-tone) 40%, transparent);
		background: color-mix(in srgb, var(--git-ref-tone) 12%, transparent);
		transition: border-color 0.12s var(--ease);
	}
	.pr:hover {
		border-color: var(--git-ref-tone);
	}
	.pr:focus-visible {
		outline: 2px solid var(--git-ref-tone);
		outline-offset: 2px;
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
