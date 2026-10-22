<script lang="ts">
	import { canonicalTone, type Tone } from '$lib/tone';
	// Section / group header: heading + optional subtitle, icon, count, hue
	// swatch and right-aligned actions on one wrapping row. `divider` underlines
	// it, `sticky` pins it under the app header and publishes its height as
	// `--section-header-h` on the parent so sibling sticky content can offset
	// itself. `collapsible` puts a disclosure button inside the heading that
	// toggles the `children` block rendered beneath. `variant="group"` is the
	// non-wrapping list-group row: `lead` · title · count · flexible rule · actions.
	import type { Snippet } from 'svelte';
	import Heading from '../atoms/Heading.svelte';
	import Icon, { type IconName } from '../atoms/Icon.svelte';
	import Text from '../atoms/Text.svelte';

	type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

	let {
		title,
		label,
		variant = 'default',
		lead,
		level = 2,
		size,
		subtitle,
		icon,
		count,
		tone = 'neutral',
		hue,
		uppercase = false,
		divider = false,
		sticky = false,
		collapsible = false,
		open = $bindable(true),
		class: klass = '',
		actions,
		children,
		...rest
	}: {
		title?: string;
		/** Alias for `title`. */
		label?: string;
		variant?: 'default' | 'group';
		/** Leading content before the title (status dot, badge); group rows. */
		lead?: Snippet;
		level?: 1 | 2 | 3 | 4;
		size?: Size;
		subtitle?: string;
		icon?: IconName;
		count?: number | string;
		tone?: Tone;
		/** Hue (0–360) rendered as a small swatch chip before the title. */
		hue?: number;
		uppercase?: boolean;
		divider?: boolean;
		sticky?: boolean;
		collapsible?: boolean;
		open?: boolean;
		class?: string;
		actions?: Snippet;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();

	const text = $derived(title ?? label ?? '');
	const id = $props.id();
	const panelId = `${id}-panel`;
	let el = $state<HTMLElement>();
	let height = $state(0);

	$effect(() => {
		const parent = el?.parentElement;
		if (!parent) return;
		if (sticky) parent.style.setProperty('--section-header-h', `${height}px`);
		else parent.style.removeProperty('--section-header-h');
		return () => parent.style.removeProperty('--section-header-h');
	});
</script>

<div
	bind:this={el}
	bind:offsetHeight={height}
	data-tsu="SectionHeader"
	class="section-header sh-{canonicalTone(tone)} {klass}"
	class:sh-divider={divider}
	class:sh-group={variant === 'group'}
	class:sh-sticky={sticky}
	class:sh-uppercase={uppercase}
	class:sh-open={open}
	class:sh-collapsible={collapsible}
	{...rest}
>
	<div class="sh-row">
		{#if collapsible}
			<span class="sh-head">{@render head()}</span>
		{:else}
			{@render head()}
		{/if}
		{#if subtitle}
			<Text variant="caption" class="sh-subtitle">{subtitle}</Text>
		{/if}
		{#if variant === 'group'}
			<span class="sh-rule" aria-hidden="true"></span>
		{/if}
		{#if actions}
			<div class="sh-actions">{@render actions()}</div>
		{/if}
	</div>
	{#if children && (!collapsible || open)}
		<div class="sh-panel" id={panelId}>{@render children()}</div>
	{/if}
</div>

{#snippet head()}
	{#if lead}
		<span class="sh-lead">{@render lead()}</span>
	{/if}
	{#if hue !== undefined}
		<span class="sh-swatch" style:--sh-hue={hue} aria-hidden="true"></span>
	{/if}
	{#if collapsible}
		<Heading {level} {size} class="sh-title">
			<button
				type="button"
				class="sh-toggle"
				aria-expanded={open}
				aria-controls={open ? panelId : undefined}
				onclick={() => (open = !open)}
			>
				<Icon name="chevron-right" class="sh-chevron" />
				{#if icon}
					<span class="sh-icon" aria-hidden="true"><Icon name={icon} /></span>
				{/if}
				{text}
			</button>
		</Heading>
	{:else}
		{#if icon}
			<span class="sh-icon" aria-hidden="true"><Icon name={icon} /></span>
		{/if}
		<Heading {level} {size} class="sh-title">{text}</Heading>
	{/if}
	{#if count !== undefined}
		<Text tone="faint" weight="normal" numeric class="sh-count">{count}</Text>
	{/if}
{/snippet}

<style>
	.section-header {
		--sh-tone: var(--text);
	}
	.sh-ok {
		--sh-tone: var(--ok);
	}
	.sh-warn {
		--sh-tone: var(--warn);
	}
	.sh-danger {
		--sh-tone: var(--danger);
	}
	.sh-info {
		--sh-tone: var(--info);
	}
	.sh-accent {
		--sh-tone: var(--accent);
	}
	.sh-row {
		display: flex;
		align-items: center;
		gap: var(--sp-3);
		flex-wrap: wrap;
		min-width: 0;
	}
	.sh-divider > .sh-row {
		padding-bottom: var(--sp-2);
		border-bottom: var(--edge-width) solid var(--surface-edge);
	}
	.sh-group > .sh-row {
		flex-wrap: nowrap;
		gap: var(--sp-2);
	}
	.sh-lead {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-2);
		flex: none;
	}
	.sh-rule {
		flex: 1 1 auto;
		min-width: var(--sp-4);
		height: 1px;
		background: var(--border);
	}
	.sh-group .sh-actions {
		flex: none;
		flex-wrap: nowrap;
		margin-inline-start: 0;
	}
	.sh-sticky {
		position: sticky;
		top: var(--sticky-offset, var(--header-h, 0));
		z-index: 1;
		background: var(--section-header-bg, var(--bg));
	}
	.section-header :global(.sh-title) {
		color: var(--sh-tone);
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.sh-uppercase :global(.sh-title) {
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-size: var(--fs-xs);
		color: var(--text-muted);
	}
	.sh-ok.sh-uppercase :global(.sh-title),
	.sh-warn.sh-uppercase :global(.sh-title),
	.sh-danger.sh-uppercase :global(.sh-title),
	.sh-info.sh-uppercase :global(.sh-title) {
		color: var(--sh-tone);
	}
	.sh-icon {
		display: inline-flex;
		flex: none;
		color: var(--sh-tone);
		line-height: var(--lh-none);
	}
	.sh-swatch {
		flex: none;
		width: 0.625rem;
		height: 0.625rem;
		border-radius: var(--r-sm);
		background: hsl(var(--sh-hue) 70% 55%);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text) 20%, transparent);
	}
	.section-header :global(.sh-subtitle) {
		flex: 1 1 auto;
		min-width: 0;
	}
	.sh-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--sp-2);
		margin-inline-start: auto;
	}
	.sh-head {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
	}
	.sh-toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		color: inherit;
		text-align: start;
		cursor: pointer;
		border-radius: var(--r-sm);
	}
	.sh-toggle:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
	.section-header :global(.sh-chevron) {
		flex: none;
		color: var(--text-muted);
		transition: rotate var(--dur-base) var(--ease-out);
	}
	.sh-open :global(.sh-chevron) {
		rotate: 90deg;
	}
	.sh-panel {
		margin-top: var(--sp-3);
		transition:
			opacity var(--dur-base) var(--ease-out),
			translate var(--dur-base) var(--ease-out);
	}
	@starting-style {
		.sh-collapsible.sh-open .sh-panel {
			opacity: 0;
			translate: 0 calc(-1 * var(--shift-xs));
		}
	}
</style>
