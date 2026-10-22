<script lang="ts">
	import Icon, { isIconName } from '$lib/components/atoms/Icon.svelte';
	import { formatCount, hasCount } from '$lib/count';
	import { playSound } from '$lib/sound';
	import type { ControlSize } from '$lib/size';
	import { canonicalTone, type Tone } from '$lib/tone';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type ButtonProps = HTMLButtonAttributes & {
		// `link`: no box at all — an inline text action coloured like a link
		// (or like `tone` when set), underlined on hover/focus.
		variant?: 'default' | 'primary' | 'ghost' | 'danger' | 'link';
		// Semantic state tint layered on top of the variant: tints text/border and
		// adds a subtle fill on hover. For stateful controls — an "on"/active toggle
		// (`accent`), positive actions (`success`), or cost/severity states.
		tone?: Tone | 'none';
		size?: ControlSize;
		control?: boolean;
		// Fully rounded ends (`--r-pill`) on any size/variant.
		pill?: boolean;
		block?: boolean;
		// Fill the available width of a flex/Cluster row (flex: 1). `block` stretches
		// to 100% (grid/stack); `grow` shares a flex row with siblings.
		grow?: boolean;
		// `shrink={false}` pins the button to its intrinsic width in a flex row
		// (flex: none, top-aligned) so a growing sibling can't squash it.
		shrink?: boolean;
		// Render as a link (`<a href>`) while keeping button chrome — for navigations
		// and open-in-new-tab actions that shouldn't be a bare <a>. Setting `href`
		// implies `as="a"`.
		as?: 'button' | 'a';
		href?: string;
		target?: string;
		rel?: string;
		// Square icon-only tap target (IconButton), `--box-md` unless
		// `box` says otherwise. `iconInline` is the borderless, compact variant
		// (chip-remove ✕, inline edit ✎); pair with `hoverDanger` to tint it red on
		// hover (delete affordances).
		icon?: boolean;
		// Shared square box scale (`--box-xs/sm/md/lg`): always square, no padding,
		// never flexes. Implies an icon-only control.
		box?: 'xs' | 'sm' | 'md' | 'lg';
		// Square text/icon control whose side equals the current height contract:
		// `size` tier, or `--control-height` with `control`.
		square?: boolean;
		// Outlined `--box-lg`-tall chip (header/toolbar action): a square for a lone
		// glyph, otherwise sized to its text. Pairs with `tone` for tinted severity chips.
		chip?: boolean;
		iconInline?: boolean;
		hoverDanger?: boolean;
		// Hide `[data-label]` children below 40rem viewport (`mobile`) or 30rem
		// container (`container`) so the button becomes icon-only; the hidden text
		// becomes the aria-label unless one is set.
		collapseLabel?: 'never' | 'mobile' | 'container';
		// Icon-only/square buttons grow a touch hit slab on coarse pointers without
		// moving layout; `compact` opts out in dense tables.
		hitArea?: 'auto' | 'compact';
		// Async/busy state: shows a spinner, blocks clicks, sets aria-busy. Stays
		// disabled-equivalent while true (so a double-submit can't fire). `'done'`
		// is the settled state after a busy run: clickable again, a check beside
		// the label (with `loadingStyle="morph"` the label springs back in).
		loading?: boolean | 'done';
		// How a busy button shows it: an inline spinner before the label, the label
		// morphing into a centred spinner at constant width, or a progress fill
		// pouring in from the left (driven by `progress`).
		loadingStyle?: 'spinner' | 'morph' | 'fill';
		// 0–1 for `loadingStyle="fill"`; omit for an indeterminate idle fill.
		progress?: number;
		// Text beside the check in the `'done'` state; defaults to the children.
		// With `morph`, keep the children constant and set this instead so both
		// stacked labels size the button and its width never changes.
		doneLabel?: string;
		// Corner count indicator (unread, selected, pending). Hidden at 0/undefined;
		// shows `${countMax}+` past the cap while the accessible name carries the
		// exact number. Tint via `--btn-count-bg` / `--btn-count-fg`.
		count?: number;
		countMax?: number;
		// `stacked`: a hotbar slot, `glyph` over the label, height following `size`.
		layout?: 'inline' | 'stacked';
		// Leading glyph (above the label when stacked): a registry icon name, any
		// other text (emoji, ■), or a snippet.
		glyph?: Snippet | string;
		// Key hint in the top-left corner, also exposed as `aria-keyshortcuts`.
		// Display only: the app binds the key.
		shortcut?: string;
		// Two-state toggle: sets `aria-pressed`.
		pressed?: boolean;
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
		class?: string;
		children?: Snippet;
	};

	let {
		variant = 'default',
		tone = 'none',
		size = 'md',
		control = false,
		pill = false,
		block = false,
		grow = false,
		shrink = true,
		as = 'button',
		href,
		icon = false,
		box,
		square = false,
		chip = false,
		iconInline = false,
		hoverDanger = false,
		collapseLabel = 'never',
		hitArea = 'auto',
		loading = false,
		loadingStyle = 'spinner',
		progress,
		doneLabel,
		count,
		countMax = 99,
		layout = 'inline',
		glyph,
		shortcut,
		pressed,
		sound = true,
		type = 'button',
		disabled = false,
		title,
		onclick,
		class: klass = '',
		children,
		...rest
	}: ButtonProps = $props();
	const t = $derived(canonicalTone(tone));

	// A link-flavoured Button is a real <a>; native `disabled`/`type` don't apply,
	// so an inactive link drops `href` (no focus, no keyboard activation).
	const tag = $derived(href !== undefined || as === 'a' ? 'a' : 'button');
	const busy = $derived(loading === true);
	const done = $derived(loading === 'done');
	const layered = $derived(loadingStyle !== 'spinner');
	const inactive = $derived(disabled || busy);
	const elementAttrs = $derived(
		tag === 'a'
			? inactive
				? { href: undefined, role: 'link', 'aria-disabled': true }
				: { href }
			: { type, disabled: inactive }
	);
	const handleClick = (e: Parameters<NonNullable<typeof onclick>>[0]) => {
		if (inactive) {
			e.preventDefault();
			return;
		}
		playSound('click', sound);
		onclick?.(e);
	};

	const counted = $derived(hasCount(count));
	const countText = $derived(hasCount(count) ? formatCount(count, countMax) : '');
	// aria-label replaces the content as the accessible name, so the count is
	// folded into it; without one the sr-only span below is read after the label.
	const withCount = (name: string) => (counted ? `${name}, ${count}` : name);

	const stacked = $derived(layout === 'stacked');
	const keyHint = $derived(shortcut?.trim() || undefined);

	let el = $state<HTMLElement | null>(null);
	const explicitName = $derived(rest['aria-label'] ?? rest['aria-labelledby']);
	const ariaLabel = $derived(rest['aria-label'] ? withCount(rest['aria-label']) : undefined);
	$effect(() => {
		if (!el || collapseLabel === 'never' || explicitName) return;
		const node = el;
		const sync = () => {
			const labels = Array.from(node.querySelectorAll('[data-label]'), (n) => n.textContent?.trim())
				.filter(Boolean)
				.join(' ');
			const text = labels && withCount(labels);
			if (text) node.setAttribute('aria-label', text);
			else node.removeAttribute('aria-label');
		};
		sync();
		const observer = new MutationObserver(sync);
		observer.observe(node, { childList: true, characterData: true, subtree: true });
		return () => observer.disconnect();
	});
</script>

<svelte:element
	this={tag}
	bind:this={el}
	data-tsu="Button"
	{...rest}
	{...elementAttrs}
	aria-label={ariaLabel}
	aria-busy={busy || undefined}
	aria-pressed={pressed ?? rest['aria-pressed']}
	aria-keyshortcuts={rest['aria-keyshortcuts'] ?? keyHint}
	{title}
	class="btn {klass}"
	class:btn-grow={grow}
	class:btn-primary={variant === 'primary'}
	class:btn-ghost={variant === 'ghost'}
	class:btn-danger={variant === 'danger' || (t === 'danger' && variant === 'default')}
	class:btn-link={variant === 'link'}
	class:btn-pill={pill}
	class:no-shrink={!shrink}
	class:btn-sm={size === 'sm'}
	class:btn-lg={size === 'lg'}
	class:btn-control={control}
	class:btn-block={block}
	class:btn-icon={icon}
	class:btn-box={box !== undefined}
	class:btn-square={square}
	class:btn-chip={chip}
	class:btn-collapse-mobile={collapseLabel === 'mobile'}
	class:btn-collapse-container={collapseLabel === 'container'}
	class:hit-compact={hitArea === 'compact'}
	style:--btn-box={box ? `var(--box-${box})` : undefined}
	style:--btn-progress={loadingStyle === 'fill' && progress !== undefined ? Math.min(1, Math.max(0, progress)) : undefined}
	class:btn-tone-accent={t === 'accent'}
	class:btn-tone-success={t === 'ok'}
	class:btn-tone-info={t === 'info'}
	class:btn-tone-warn={t === 'warn'}
	class:btn-tone-danger={t === 'danger'}
	class:btn-icon-inline={iconInline}
	class:hover-danger={hoverDanger}
	class:loading={busy}
	class:btn-done={done}
	class:btn-morph={loadingStyle === 'morph'}
	class:btn-fill={loadingStyle === 'fill'}
	class:btn-counted={counted}
	class:btn-stacked={stacked}
	class:btn-hinted={keyHint !== undefined}
	onclick={handleClick}
>
	{#if loadingStyle === 'fill'}<span class="btn-fill-bar" aria-hidden="true"></span>{/if}
	{#if busy && !layered}<span class="btn-spinner" aria-hidden="true"></span>{:else if done && !layered}<span class="btn-check" aria-hidden="true"><Icon name="check" /></span>{/if}
	{#if glyph !== undefined}
		<span class="btn-glyph" aria-hidden="true">
			{#if typeof glyph !== 'string'}{@render glyph()}{:else if isIconName(glyph)}<Icon name={glyph} />{:else}{glyph}{/if}
		</span>
	{/if}
	{#if stacked}
		<span class="btn-stack-label">{@render children?.()}</span>
	{:else if layered}
		<span class="btn-layers">
			<span class="btn-layer btn-layer-label">{@render children?.()}</span>
			{#if loadingStyle === 'morph'}
				<span class="btn-layer btn-layer-spin" aria-hidden="true"></span>
				<span class="btn-layer btn-layer-done" aria-hidden="true"><Icon name="check" />{#if doneLabel !== undefined}{doneLabel}{:else}{@render children?.()}{/if}</span>
			{:else}
				<span class="btn-layer btn-layer-ink" aria-hidden="true">{@render children?.()}</span>
			{/if}
		</span>
	{:else}
		{@render children?.()}
	{/if}
	{#if keyHint}<span class="btn-shortcut" aria-hidden="true">{keyHint}</span>{/if}
	{#if counted}
		<span class="btn-count" aria-hidden="true">{countText}</span>
		<span class="btn-count-sr">, {count}</span>
	{/if}
</svelte:element>

<style>
	/* The canonical control: owns its variants/sizes/modifiers from theme tokens.
	   Svelte 5 scopes via :where() (zero added specificity), so feature-component
	   overrides keep winning by specificity. Icons size themselves (Icon.svelte),
	   so no svg sizing rule lives here. */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		padding: var(--sp-2) var(--btn-px-md);
		min-height: var(--btn-size, var(--control-height-default));
		max-width: 100%;
		border: var(--edge-width) solid var(--btn-border, var(--btn-edge));
		border-radius: var(--btn-radius, var(--r-md));
		background: var(--btn-bg, var(--btn-fill));
		--btn-shadow-rest: var(--btn-shadow);
		--btn-shadow-lift: var(--btn-shadow-hover);
		box-shadow: var(--btn-shadow-rest);
		color: var(--btn-fg, var(--text));
		font-weight: var(--fw-medium);
		font-size: var(--control-fs-md);
		line-height: var(--lh-none);
		--icon-size: var(--control-icon-md);
		--btn-scale-dur: var(--dur-release);
		--btn-scale-ease: var(--ease-spring-bounce);
		transition:
			background var(--dur-fast) ease,
			border-color var(--dur-fast) ease,
			box-shadow var(--dur-fast) ease,
			color var(--dur-fast) ease,
			opacity var(--dur-fast) ease,
			filter var(--dur-fast) ease,
			translate var(--dur-fast) var(--ease-out),
			scale var(--btn-scale-dur) var(--btn-scale-ease);
		user-select: none;
		white-space: normal;
		overflow-wrap: break-word;
	}
	.btn:disabled {
		opacity: var(--disabled-opacity);
		cursor: not-allowed;
	}
	.btn:focus-visible:not(.btn-link, .btn-icon-inline, [aria-pressed='true']) {
		box-shadow: var(--btn-shadow-rest), var(--focus-glow);
	}
	/* Press: scale in over --dur-press, spring back over --dur-release. */
	.btn:active:not(:disabled, [aria-disabled='true'], .loading, .btn-link) {
		--btn-scale-dur: var(--dur-press);
		--btn-scale-ease: var(--ease-out);
		scale: var(--press-scale);
	}
	.btn-icon:active:not(:disabled, [aria-disabled='true'], .loading),
	.btn-box:active:not(:disabled, [aria-disabled='true'], .loading),
	.btn-square:active:not(:disabled, [aria-disabled='true'], .loading),
	.btn-icon-inline:active:not(:disabled, [aria-disabled='true'], .loading) {
		scale: var(--press-scale-sm);
	}
	.btn-primary {
		background: var(--btn-bg, var(--btn-primary-fill));
		border-color: var(--btn-border, var(--btn-primary-edge));
		--btn-shadow-rest: var(--btn-primary-shadow);
		--btn-shadow-lift: var(--btn-primary-shadow-hover);
		color: var(--btn-fg, var(--text-on-accent));
		font-weight: var(--fw-semibold);
	}
	.btn-danger {
		color: var(--danger);
		border-color: color-mix(in srgb, var(--danger) 50%, var(--border));
	}
	.btn-ghost {
		background: var(--btn-bg, transparent);
		border-color: var(--btn-border, transparent);
		--btn-shadow-rest: none;
		--btn-shadow-lift: none;
	}
	.btn-sm {
		min-height: var(--btn-size, var(--control-height-compact));
		padding: var(--sp-1) var(--btn-px-sm);
		font-size: var(--control-fs-sm);
		--icon-size: var(--control-icon-sm);
	}
	.btn-lg {
		min-height: var(--btn-size, var(--control-height-large));
		padding: var(--sp-3) var(--btn-px-lg);
		font-size: var(--control-fs-lg);
		--icon-size: var(--control-icon-lg);
	}
	.btn-block {
		width: 100%;
	}
	.btn-grow {
		flex: 1 1 0;
	}
	/* Link-flavoured Button: keep button chrome, drop the anchor's default link
	   look, and make a disabled link truly inert. */
	a.btn {
		text-decoration: none;
	}
	a.btn[aria-disabled='true'] {
		opacity: var(--disabled-opacity);
		pointer-events: none;
		cursor: not-allowed;
	}

	/* Semantic state tones — tint text + border, subtle fill on hover. Layered on
	   the neutral/ghost variant; each defines --btn-tone so one ruleset paints. */
	.btn-tone-accent {
		--btn-tone: var(--accent);
	}
	.btn-tone-success {
		--btn-tone: var(--ok);
	}
	.btn-tone-info {
		--btn-tone: var(--info);
	}
	.btn-tone-warn {
		--btn-tone: var(--warn);
	}
	.btn-tone-danger {
		--btn-tone: var(--danger);
	}
	.btn-tone-accent,
	.btn-tone-success,
	.btn-tone-info,
	.btn-tone-warn,
	.btn-tone-danger {
		color: var(--btn-tone);
		border-color: color-mix(in srgb, var(--btn-tone) 50%, var(--border));
	}

	/* Icon-chip: larger square outlined tap target for header/toolbar actions.
	   Combines with a tone for tinted severity chips. */
	.btn-chip {
		min-height: var(--box-lg);
		min-width: var(--box-lg);
		height: var(--box-lg);
		width: auto;
		padding: 0 var(--sp-2);
		gap: var(--sp-1);
		flex: none;
		border-radius: var(--r-md);
	}
	.btn-chip:has(> :global(svg):only-child) {
		width: var(--box-lg);
		padding: 0;
	}

	/* Uniform-height control: icon buttons, inputs and action buttons that share a
	   toolbar/composer row line up exactly. */
	.btn-control {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		height: var(--btn-size, var(--control-height));
		min-height: var(--btn-size, var(--control-height));
		padding: 0 var(--control-px-md);
		border: var(--edge-width) solid var(--btn-border, var(--btn-edge));
		border-radius: var(--btn-radius, var(--r-md));
		background: var(--btn-bg, var(--btn-fill));
		color: var(--btn-fg, var(--text));
		font-weight: var(--fw-medium);
		font-size: var(--control-fs-md);
		line-height: var(--lh-none);
		white-space: normal;
		user-select: none;
	}
	.btn-control:disabled {
		opacity: var(--disabled-opacity);
		cursor: not-allowed;
	}
	/* .btn-control follows .btn-primary in source order and would otherwise paint
	   the primary action with the neutral --surface; restore the accent fill when
	   both are present. */
	.btn-control.btn-primary {
		background: var(--btn-bg, var(--btn-primary-fill));
		border-color: var(--btn-border, var(--btn-primary-edge));
		color: var(--btn-fg, var(--text-on-accent));
	}
	.btn-control.btn-tone-success {
		color: var(--ok);
		border-color: color-mix(in srgb, var(--ok) 50%, var(--border));
	}
	.btn-control.btn-danger,
	.btn-control.btn-tone-danger {
		color: var(--danger);
		border-color: color-mix(in srgb, var(--danger) 50%, var(--border));
	}
	/* A positive primary action uses success as its fill, not merely as the
	   neutral tint. This follows the control override so both heights match. */
	.btn-primary.btn-tone-success {
		background: var(--ok);
		border-color: var(--ok);
		color: var(--text-on-success);
	}
	/* Other tones on a primary action tint the accent fill rather than repaint the
	   text, so the on-accent foreground stays readable (bare tone-as-text would be
	   accent-on-accent). success keeps its own filled guard above. */
	.btn-primary.btn-tone-accent,
	.btn-primary.btn-tone-info,
	.btn-primary.btn-tone-warn,
	.btn-primary.btn-tone-danger {
		background: color-mix(in srgb, var(--btn-tone) 35%, var(--accent));
		border-color: color-mix(in srgb, var(--btn-tone) 35%, var(--accent));
		color: var(--text-on-accent);
	}

	.no-shrink {
		flex: none;
		align-self: flex-start;
	}
	.btn-pill {
		border-radius: var(--btn-radius, var(--r-pill));
	}
	/* Link variant: no box, inherits the surrounding text size. Placed after the
	   size rules so their min-height doesn't reapply; a tone wins over --link. */
	.btn-link {
		min-height: auto;
		height: auto;
		padding: 0 var(--sp-1);
		border: none;
		background: none;
		box-shadow: none;
		border-radius: 0;
		font-size: inherit;
		line-height: var(--lh-none);
		color: var(--btn-tone, var(--link));
	}
	.btn-link:focus-visible {
		background: none;
		border: none;
		text-decoration: underline;
	}
	/* Icon-only buttons (IconButton). Square box = consistent --box-md tap target. */
	.btn-icon {
		min-height: var(--box-md);
		min-width: var(--box-md);
		padding: var(--sp-2);
	}
	/* `square`: side = the height contract in force (size tier or control). */
	.btn-square {
		width: var(--btn-size, var(--control-height-default));
		min-width: var(--btn-size, var(--control-height-default));
		padding: 0;
		flex: none;
	}
	.btn-square.btn-sm {
		width: var(--btn-size, var(--control-height-compact));
		min-width: var(--btn-size, var(--control-height-compact));
	}
	.btn-square.btn-lg {
		width: var(--btn-size, var(--control-height-large));
		min-width: var(--btn-size, var(--control-height-large));
		height: var(--btn-size, var(--control-height-large));
	}
	.btn-square.btn-control {
		width: var(--btn-size, var(--control-height));
		min-width: var(--btn-size, var(--control-height));
	}
	/* `box`: explicit square scale, wins over icon/chip/square/size sizing. */
	.btn-box {
		width: var(--btn-box);
		min-width: var(--btn-box);
		height: var(--btn-box);
		min-height: var(--btn-box);
		padding: 0;
		flex: none;
	}
	.btn-icon-inline {
		min-height: 0;
		min-width: 0;
		padding: 0 var(--sp-1);
		border: none;
		background: none;
		color: var(--text-muted);
	}

	/* Label collapse: `[data-label]` children disappear below the threshold and
	   the button falls back to icon-only padding. */
	@media (max-width: 40rem) {
		.btn-collapse-mobile :global([data-label]) {
			display: none;
		}
		.btn-collapse-mobile {
			padding: var(--sp-2);
			gap: 0;
		}
	}
	@container (max-width: 30rem) {
		.btn-collapse-container :global([data-label]) {
			display: none;
		}
		.btn-collapse-container {
			padding: var(--sp-2);
			gap: 0;
		}
	}

	/* Coarse pointers: icon-only and square buttons carry an invisible slab that
	   extends the hit area towards --touch-target without changing layout. Buttons
	   already at or above the target keep their own box (inset never positive).
	   The slab is the centred target with its inline-end half cut off: inline-end
	   overflow counts towards the scrollable overflow of every scroll ancestor, and
	   in a row that half lies under the next sibling anyway. Growing further towards
	   the start would let each slab cover the previous sibling's centre. Text
	   buttons at size sm and link buttons take the same shape sized by
	   --touch-slab. */
	@media (pointer: coarse) {
		.btn-icon:not(.hit-compact),
		.btn-icon-inline:not(.hit-compact),
		.btn-box:not(.hit-compact),
		.btn-square:not(.hit-compact),
		.btn-chip:not(.hit-compact),
		.btn-stacked:not(.hit-compact) {
			position: relative;
		}
		.btn-icon:not(.hit-compact)::after,
		.btn-icon-inline:not(.hit-compact)::after,
		.btn-box:not(.hit-compact)::after,
		.btn-square:not(.hit-compact)::after,
		.btn-chip:not(.hit-compact)::after,
		.btn-stacked:not(.hit-compact)::after {
			content: '';
			position: absolute;
			inset-block: min(0px, calc((100% - var(--touch-target)) / 2));
			inset-inline-start: min(0px, calc((100% - var(--touch-target)) / 2));
			inset-inline-end: 0;
		}
		.btn-sm:not(.btn-icon, .btn-icon-inline, .btn-box, .btn-square, .btn-chip, .btn-stacked, .hit-compact) {
			position: relative;
		}
		.btn-sm:not(.btn-icon, .btn-icon-inline, .btn-box, .btn-square, .btn-chip, .btn-stacked, .hit-compact)::before {
			content: '';
			position: absolute;
			inset-block: var(--touch-slab);
			inset-inline-start: var(--touch-slab);
			inset-inline-end: 0;
		}
		.btn-link:not(.hit-compact) {
			position: relative;
		}
		.btn-link:not(.hit-compact)::before {
			content: '';
			position: absolute;
			inset-block: var(--touch-slab);
			inset-inline-start: var(--touch-slab);
			inset-inline-end: 0;
		}
	}

	/* Two-state (toggle) buttons — e.g. an IconButton with `pressed`. Reacts to
	   the native aria-pressed that flows through, so no extra class. Tint defaults
	   to the accent; override per-instance with `style="--btn-on: var(--warn)"`. */
	.btn[aria-pressed='true'] {
		color: var(--btn-on, var(--accent));
	}

	/* Stacked hotbar slot: glyph over a short label. Follows the size and
	   control rules so its own heights win at equal specificity. */
	.btn-stacked,
	.btn-stacked.btn-sm,
	.btn-stacked.btn-lg,
	.btn-stacked.btn-control {
		flex-direction: column;
		gap: var(--sp-1);
		height: auto;
		min-height: var(--btn-size, var(--control-height-large));
		min-width: var(--btn-size, var(--control-height-large));
		padding: var(--sp-1) var(--sp-2);
		font-size: var(--fs-xs);
	}
	.btn-stacked.btn-sm {
		min-height: var(--btn-size, var(--control-height-default));
		min-width: var(--btn-size, calc(var(--control-height-default) + var(--sp-1) + var(--sp-0-5)));
		gap: var(--sp-0-5);
		padding: var(--sp-1);
		font-size: calc(var(--fs-xs) * 0.85);
	}
	.btn-stacked.btn-lg {
		min-height: var(--btn-size, calc(var(--control-height-large) + var(--sp-2) + var(--sp-0-5)));
		min-width: var(--btn-size, calc(var(--control-height-large) + var(--sp-2) + var(--sp-0-5)));
		padding: var(--sp-2) var(--sp-3);
		font-size: var(--fs-sm);
	}
	.btn-glyph {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		line-height: var(--lh-none);
		font-size: var(--icon-size);
	}
	.btn-stacked .btn-glyph {
		font-size: var(--fs-lg);
	}
	.btn-stacked.btn-sm .btn-glyph {
		font-size: var(--fs-md);
	}
	.btn-stacked.btn-lg .btn-glyph {
		font-size: var(--fs-xl);
	}
	.btn-stack-label {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.btn-stacked.btn-danger,
	.btn-stacked.btn-tone-danger {
		color: var(--danger);
		border-color: var(--danger);
	}
	.btn-stacked[aria-pressed='true'] {
		border-color: var(--btn-on, var(--accent));
		box-shadow: inset 0 0 0 1px var(--btn-on, var(--accent));
	}

	/* Corner key hint: mirrors the count pill in the opposite corner, inside the box. */
	.btn-hinted {
		position: relative;
	}
	.btn-shortcut {
		position: absolute;
		top: var(--sp-0-5);
		left: var(--sp-1);
		font-family: var(--font-mono);
		font-size: calc(var(--fs-xs) * 0.75);
		font-weight: var(--fw-medium);
		color: var(--text-faint);
		line-height: var(--lh-none);
		pointer-events: none;
	}

	/* Loading: keep full opacity (it's busy, not disabled-looking) + a wait cursor,
	   and show a spinner in the current text color. */
	.btn.loading {
		cursor: wait;
	}
	.btn.loading:disabled {
		opacity: 1;
	}
	.btn-spinner {
		width: 0.9em;
		height: 0.9em;
		flex: none;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: var(--r-pill);
		animation: btn-spin 0.6s linear infinite;
		transition: opacity var(--dur-fast) ease;
	}
	@starting-style {
		.btn-spinner {
			opacity: 0;
		}
	}
	@keyframes btn-spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Corner count: anchored to the top-right corner and pulled half outside it,
	   so the button keeps its own box and any size/variant/box carries one. */
	.btn-counted {
		position: relative;
	}
	.btn-count {
		position: absolute;
		top: 0;
		right: 0;
		transform: translate(45%, -45%);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		min-width: var(--btn-count-size, 1.125rem);
		height: var(--btn-count-size, 1.125rem);
		padding: 0 var(--sp-1);
		border-radius: var(--r-pill);
		background: var(--btn-count-bg, var(--accent));
		color: var(--btn-count-fg, var(--text-on-accent));
		font-size: var(--fs-xs);
		font-weight: var(--fw-semibold);
		font-variant-numeric: tabular-nums;
		line-height: var(--lh-none);
		white-space: nowrap;
		pointer-events: none;
	}
	.btn-sm .btn-count,
	.btn-link .btn-count,
	.btn-icon-inline .btn-count {
		--btn-count-size: 1rem;
		padding: 0 var(--sp-0-5);
		font-size: var(--fs-xs);
	}
	/* The accent fill would swallow an accent pill: invert on primary. */
	.btn-primary .btn-count {
		background: var(--btn-count-bg, var(--text-on-accent));
		color: var(--btn-count-fg, var(--accent));
	}
	.btn-count-sr {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	/* Hover only on devices that have it: taps leave sticky hovers on touch. */
	@media (hover: hover) and (pointer: fine) {
		.btn:hover:not(:disabled) {
			border-color: var(--accent);
			translate: 0 calc(-1 * var(--hover-lift));
			--btn-shadow-rest: var(--btn-shadow-lift);
		}
		.btn-primary:hover:not(:disabled) {
			filter: brightness(1.08);
		}
		.btn-danger:hover:not(:disabled) {
			background: color-mix(in srgb, var(--danger) 14%, transparent);
			border-color: var(--danger);
		}
		.btn-ghost:hover:not(:disabled) {
			background: var(--bg-elevated-2);
			border-color: transparent;
		}
		.btn-tone-accent:hover:not(:disabled),
		.btn-tone-success:hover:not(:disabled),
		.btn-tone-info:hover:not(:disabled),
		.btn-tone-warn:hover:not(:disabled),
		.btn-tone-danger:hover:not(:disabled) {
			background: color-mix(in srgb, var(--btn-tone) 14%, transparent);
			border-color: var(--btn-tone);
		}
		.btn-control:hover:not(:disabled) {
			border-color: var(--accent);
		}
		.btn-control.btn-primary:hover:not(:disabled) {
			border-color: var(--accent);
			filter: brightness(1.08);
		}
		.btn-control.btn-tone-success:hover:not(:disabled) {
			background: color-mix(in srgb, var(--ok) 14%, transparent);
			border-color: var(--ok);
		}
		.btn-control.btn-danger:hover:not(:disabled),
		.btn-control.btn-tone-danger:hover:not(:disabled) {
			background: color-mix(in srgb, var(--danger) 14%, transparent);
			border-color: var(--danger);
		}
		.btn-primary.btn-tone-success:hover:not(:disabled) {
			background: var(--ok);
			border-color: var(--ok);
			filter: brightness(1.08);
		}
		.btn-primary.btn-tone-accent:hover:not(:disabled),
		.btn-primary.btn-tone-info:hover:not(:disabled),
		.btn-primary.btn-tone-warn:hover:not(:disabled),
		.btn-primary.btn-tone-danger:hover:not(:disabled) {
			background: color-mix(in srgb, var(--btn-tone) 35%, var(--accent));
			border-color: color-mix(in srgb, var(--btn-tone) 35%, var(--accent));
			filter: brightness(1.08);
		}
		.btn-link:hover:not(:disabled) {
			background: none;
			border: none;
			translate: none;
			text-decoration: underline;
		}
		.btn-icon-inline:hover:not(:disabled) {
			border: none;
			background: none;
			translate: none;
			color: var(--text);
		}
		.btn-icon-inline.hover-danger:hover:not(:disabled) {
			color: var(--danger);
		}
	}
	/* Loading styles. `morph`: label, spinner and done check stack in one grid
	   cell so the width never changes. `fill`: a progress bar under the label,
	   the label recoloured where the bar has passed. */
	.btn-check {
		display: inline-flex;
		flex: none;
		--icon-size: 0.9em;
	}
	.btn-layers {
		position: relative;
		display: grid;
		place-items: center;
		min-width: 0;
	}
	.btn-layer {
		grid-area: 1 / 1;
		display: inline-flex;
		align-items: center;
		gap: var(--sp-2);
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
		transition:
			opacity var(--dur-base) var(--ease-out),
			scale var(--dur-base) var(--ease-out),
			translate var(--dur-base) var(--ease-out);
	}
	.btn-layer-spin {
		width: 1em;
		height: 1em;
		border-radius: var(--r-pill);
		mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px));
		background: conic-gradient(from 0deg, transparent 0 30%, currentColor);
		opacity: 0;
		scale: 0.4;
	}
	.btn-layer-done {
		opacity: 0;
		translate: 0 0.5em;
		--icon-size: 0.9em;
	}
	.btn-morph.loading .btn-layer-label,
	.btn-morph.btn-done .btn-layer-label {
		opacity: 0;
		scale: 0.85;
	}
	.btn-morph.loading .btn-layer-spin {
		opacity: 1;
		scale: 1;
		animation: btn-spin 0.9s linear infinite;
	}
	.btn-morph.btn-done .btn-layer-done {
		opacity: 1;
		translate: none;
		transition-timing-function: var(--ease-spring-bounce);
		transition-duration: var(--dur-spring);
	}
	.btn-fill {
		position: relative;
		isolation: isolate;
		overflow: hidden;
		--btn-progress-fill: var(--accent);
		--btn-progress-fg: var(--text-on-accent);
	}
	.btn-fill.btn-primary {
		--btn-progress-fill: color-mix(in srgb, var(--text-on-accent) 22%, transparent);
		--btn-progress-fg: currentColor;
	}
	.btn-fill-bar {
		position: absolute;
		inset: 0;
		z-index: 0;
		background: var(--btn-progress-fill);
		scale: var(--btn-progress, 0) 1;
		transform-origin: left;
		transition: scale var(--dur-slow) var(--ease-out);
		pointer-events: none;
	}
	.btn-fill .btn-layers {
		z-index: 1;
	}
	.btn-layer-ink {
		color: var(--btn-progress-fg);
		clip-path: inset(0 calc((1 - var(--btn-progress, 0)) * 100%) 0 0);
		transition: clip-path var(--dur-slow) var(--ease-out);
	}
	.btn-fill:not(.loading, .btn-done) .btn-fill-bar,
	.btn-fill:not(.loading, .btn-done) .btn-layer-ink {
		transition-duration: var(--dur-fast);
	}

	/* Ambient hover: an effect chosen by `data-fx-hover` on the nearest ancestor
	   that sets it (`smoke` when none does, `none` turns it off). Two layers under
	   the content run their loop only while hovered; keyboard focus holds a still
	   frame. Boxless buttons and a corner count (clipped by overflow) opt out. */
	.btn {
		--fx-ink: color-mix(in srgb, var(--btn-tone, var(--accent)) 26%, transparent);
		--fx-ember: color-mix(in srgb, var(--warn) 55%, var(--accent));
		--fx-a1: color-mix(in srgb, var(--accent) 34%, transparent);
		--fx-a2: color-mix(in srgb, var(--info) 30%, transparent);
		--fx-a3: color-mix(in srgb, var(--ok) 30%, transparent);
	}
	.btn-danger {
		--fx-ink: color-mix(in srgb, var(--danger) 26%, transparent);
	}
	.btn-primary {
		--fx-ink: color-mix(in srgb, var(--text-on-accent) 16%, transparent);
		--fx-ember: color-mix(in srgb, var(--warn) 70%, var(--text-on-accent));
		--fx-a1: color-mix(in srgb, var(--text-on-accent) 18%, transparent);
		--fx-a2: color-mix(in srgb, var(--info) 45%, transparent);
		--fx-a3: color-mix(in srgb, var(--ok) 40%, transparent);
	}
	@media (hover: hover) and (pointer: fine) {
		.btn:where(:not(.btn-link, .btn-icon-inline, .btn-counted)):where(:not(:global([data-fx-hover]) *), :global([data-fx-hover]:not([data-fx-hover='none'])) *) {
			position: relative;
			isolation: isolate;
			overflow: hidden;
		}
		.btn:where(:not(.btn-link, .btn-icon-inline, .btn-counted)):where(:not(:global([data-fx-hover]) *), :global([data-fx-hover]:not([data-fx-hover='none'])) *)::before,
		.btn:where(:not(.btn-link, .btn-icon-inline, .btn-counted)):where(:not(:global([data-fx-hover]) *), :global([data-fx-hover]:not([data-fx-hover='none'])) *)::after {
			content: '';
			position: absolute;
			inset: 0;
			z-index: -1;
			pointer-events: none;
			opacity: 0;
			transition: opacity var(--dur-fast) ease;
		}
		.btn:hover:not(:disabled)::before,
		.btn:hover:not(:disabled)::after,
		.btn:focus-visible::before,
		.btn:focus-visible::after {
			opacity: 1;
		}

		/* smoke: two soft puffs drift up and across the fill */
		.btn:where(:not(:global([data-fx-hover]) *), :global([data-fx-hover='smoke']) *):where(:not(:global([data-fx-hover='smoke'] [data-fx-hover]:not([data-fx-hover='smoke'])) *))::before,
		.btn:where(:not(:global([data-fx-hover]) *), :global([data-fx-hover='smoke']) *):where(:not(:global([data-fx-hover='smoke'] [data-fx-hover]:not([data-fx-hover='smoke'])) *))::after {
			inset: -60% -30%;
			background:
				radial-gradient(40% 55% at 30% 60%, var(--fx-ink), transparent 70%),
				radial-gradient(35% 45% at 70% 40%, var(--fx-ink), transparent 70%);
			translate: 0 15%;
			animation: fx-smoke 7s var(--ease-in-out) infinite alternate;
		}
		.btn:where(:not(:global([data-fx-hover]) *), :global([data-fx-hover='smoke']) *):where(:not(:global([data-fx-hover='smoke'] [data-fx-hover]:not([data-fx-hover='smoke'])) *))::after {
			background:
				radial-gradient(30% 40% at 55% 70%, var(--fx-ink), transparent 70%),
				radial-gradient(25% 35% at 20% 30%, var(--fx-ink), transparent 70%);
			translate: 0 -10%;
			animation: fx-smoke-b 9s var(--ease-in-out) infinite alternate;
		}

		/* ember: a warm glow breathes at the bottom edge, sparks rise; press sinks 1px */
		.btn:where(:global([data-fx-hover='ember']) *):where(:not(:global([data-fx-hover='ember'] [data-fx-hover]:not([data-fx-hover='ember'])) *)) {
			--press-scale: var(--press-scale-lg);
		}
		.btn:where(:global([data-fx-hover='ember']) *):where(:not(:global([data-fx-hover='ember'] [data-fx-hover]:not([data-fx-hover='ember'])) *)):active:not(:disabled, [aria-disabled='true'], .loading, .btn-link) {
			translate: 0 calc(var(--shift-xs) / 2 - var(--hover-lift));
			--btn-shadow-rest: none;
		}
		.btn:where(:global([data-fx-hover='ember']) *):where(:not(:global([data-fx-hover='ember'] [data-fx-hover]:not([data-fx-hover='ember'])) *))::before {
			background: radial-gradient(70% 90% at 50% 115%, color-mix(in srgb, var(--fx-ember) 55%, transparent), transparent 70%);
			transform-origin: 50% 100%;
			animation: fx-ember 2.4s var(--ease-in-out) infinite;
		}
		.btn:where(:global([data-fx-hover='ember']) *):where(:not(:global([data-fx-hover='ember'] [data-fx-hover]:not([data-fx-hover='ember'])) *))::after {
			inset: 0 0 -100% 0;
			background:
				radial-gradient(circle at 18% 62%, var(--fx-ember) 0 1px, transparent 1.6px),
				radial-gradient(circle at 36% 88%, var(--fx-ember) 0 1.3px, transparent 1.9px),
				radial-gradient(circle at 52% 70%, var(--fx-ember) 0 0.9px, transparent 1.5px),
				radial-gradient(circle at 70% 94%, var(--fx-ember) 0 1.2px, transparent 1.8px),
				radial-gradient(circle at 84% 58%, var(--fx-ember) 0 1px, transparent 1.6px),
				radial-gradient(circle at 92% 80%, var(--fx-ember) 0 0.8px, transparent 1.4px);
			animation: fx-sparks 3.2s linear infinite;
		}

		/* aurora: accent, info and success flow through the fill in two crossing layers */
		.btn:where(:global([data-fx-hover='aurora']) *):where(:not(:global([data-fx-hover='aurora'] [data-fx-hover]:not([data-fx-hover='aurora'])) *))::before,
		.btn:where(:global([data-fx-hover='aurora']) *):where(:not(:global([data-fx-hover='aurora'] [data-fx-hover]:not([data-fx-hover='aurora'])) *))::after {
			inset: 0 auto 0 0;
			width: 300%;
			background: linear-gradient(90deg, var(--fx-a1), var(--fx-a2), var(--fx-a3), var(--fx-a1));
			background-size: 33.3334% 100%;
			mask-image: radial-gradient(120% 110% at 50% -10%, #000 40%, transparent 100%);
			translate: -33.3334% 0;
			animation: fx-aurora 7s linear infinite;
		}
		.btn:where(:global([data-fx-hover='aurora']) *):where(:not(:global([data-fx-hover='aurora'] [data-fx-hover]:not([data-fx-hover='aurora'])) *))::after {
			background: linear-gradient(90deg, var(--fx-a3), var(--fx-a1), var(--fx-a2), var(--fx-a3));
			background-size: 33.3334% 100%;
			mask-image: radial-gradient(120% 110% at 50% 110%, #000 30%, transparent 100%);
			translate: -66.6667% 0;
			animation: fx-aurora-back 11s linear infinite;
		}
		.btn:not(:hover)::before,
		.btn:not(:hover)::after,
		.btn:disabled::before,
		.btn:disabled::after {
			animation-play-state: paused;
		}
	}
	@keyframes fx-smoke {
		from {
			translate: -14% 22%;
			rotate: -4deg;
		}
		to {
			translate: 12% -20%;
			rotate: 5deg;
		}
	}
	@keyframes fx-smoke-b {
		from {
			translate: 10% 18%;
			rotate: 3deg;
		}
		to {
			translate: -12% -22%;
			rotate: -5deg;
		}
	}
	@keyframes fx-ember {
		0%,
		100% {
			scale: 1 1;
		}
		50% {
			scale: 1.12 1.25;
		}
	}
	@keyframes fx-sparks {
		from {
			translate: 0 0;
		}
		to {
			translate: 0 -100%;
		}
	}
	@keyframes fx-aurora {
		from {
			translate: -33.3334% 0;
		}
		to {
			translate: 0 0;
		}
	}
	@keyframes fx-aurora-back {
		from {
			translate: -33.3334% 0;
		}
		to {
			translate: -66.6667% 0;
		}
	}
</style>
