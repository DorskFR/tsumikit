<script lang="ts">
	// Side panel on the native <dialog>: top layer, focus trap, inert background,
	// focus restoration and Escape come from the platform. Adds click-outside,
	// body scroll lock, an optional page-nav column and a sticky footer.
	import type { Snippet } from 'svelte';
	import { browser } from '$lib/env';
	import Icon, { type IconName } from '$lib/components/atoms/Icon.svelte';
	import IconButton from '$lib/components/molecules/IconButton.svelte';
	import { playSound } from '$lib/sound';

	let {
		open = $bindable(),
		side = 'right',
		width = '620px',
		navWidth = '150px',
		title,
		page,
		icon,
		onclose,
		closeLabel = 'Close panel',
		header,
		nav,
		navMobile,
		children,
		footer,
		class: className,
		style,
		sound = true
	}: {
		/** Controlled visibility. When provided the `<dialog>` stays mounted and
		 *  `showModal()`/`close()` follow the value; closing sets it back to false.
		 *  Omit to open on mount (mount/unmount the component to show/hide). */
		open?: boolean;
		side?: 'left' | 'right';
		/** Panel width on wide viewports (any CSS length); clamps to 100vw. Below
		 *  48rem the panel is always full-screen. */
		width?: string;
		/** Width of the `nav` column on wide viewports. */
		navWidth?: string;
		title: string;
		/** Name of the current page, shown after the title in the header. */
		page?: string;
		/** Leading header glyph. */
		icon?: IconName;
		onclose?: () => void;
		closeLabel?: string;
		/** Replaces the whole header row (title, page, close button). */
		header?: Snippet;
		/** Vertical page list beside the content on wide viewports; on narrow
		 *  viewports it becomes a horizontal strip above the content unless
		 *  `navMobile` is provided. */
		nav?: Snippet;
		navMobile?: Snippet;
		children: Snippet;
		footer?: Snippet;
		class?: string;
		style?: string;
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
	} = $props();

	const titleId = `drawer-title-${Math.random().toString(36).slice(2, 8)}`;

	let dialogEl = $state<HTMLDialogElement | null>(null);
	const controlled = $derived(open !== undefined);
	const shown = $derived(!controlled || open === true);

	// Mounting (or mounting with `open` already true) is a sync, not a
	// transition, so it stays silent.
	let synced = false;
	$effect(() => {
		if (!dialogEl) return;
		if (!controlled) {
			dialogEl.showModal();
			return;
		}
		if (open && !dialogEl.open) {
			dialogEl.showModal();
			if (synced) playSound('open', sound);
		} else if (!open && dialogEl.open) dialogEl.close();
		synced = true;
	});

	$effect(() => {
		if (!browser || !shown) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	});

	function requestClose() {
		if (controlled) open = false;
		else playSound('close', sound);
		onclose?.();
	}

	// A drag that starts in the panel and ends on the backdrop fires click on the
	// dialog too, so the press must have landed on the backdrop as well.
	let pressOnBackdrop = false;
	function onDialogPointerDown(e: PointerEvent) {
		pressOnBackdrop = e.target === dialogEl;
	}
	function onDialogClick(e: MouseEvent) {
		const outside = pressOnBackdrop && e.target === dialogEl;
		pressOnBackdrop = false;
		if (outside) requestClose();
	}
</script>

<dialog
	bind:this={dialogEl}
	data-tsu="Drawer"
	class="drawer"
	data-side={side}
	aria-labelledby={header ? undefined : titleId}
	aria-label={header ? title : undefined}
	oncancel={(e) => {
		e.preventDefault();
		requestClose();
	}}
	onclose={() => {
		if (controlled) open = false;
		playSound('close', sound);
	}}
	onpointerdown={onDialogPointerDown}
	onclick={onDialogClick}
>
	<div
		class={['panel', className]}
		class:has-nav={Boolean(nav)}
		style:--drawer-w={width}
		style:--drawer-nav-w={navWidth}
		{style}
	>
		{#if header}
			{@render header()}
		{:else}
			<div class="panel-head">
				{#if icon}<span class="panel-icon"><Icon name={icon} /></span>{/if}
				<span id={titleId} class="panel-title truncate">{title}</span>
				{#if page}<span class="panel-page truncate">{page}</span>{/if}
				<div class="spacer"></div>
				<IconButton icon="x" label={closeLabel} onclick={requestClose} />
			</div>
		{/if}
		{#if nav}
			<nav class="panel-nav" class:has-mobile={Boolean(navMobile)}>{@render nav()}</nav>
		{/if}
		{#if navMobile}
			<nav class="panel-nav-mobile">{@render navMobile()}</nav>
		{/if}
		<div class="panel-body">
			{@render children()}
		</div>
		{#if footer}
			<div class="panel-foot">{@render footer()}</div>
		{/if}
	</div>
</dialog>

<style>
	.drawer {
		position: fixed;
		inset: 0;
		margin: 0;
		padding: 0;
		border: 0;
		background: none;
		max-width: none;
		max-height: none;
		width: auto;
		height: auto;
		color: var(--text);
		display: flex;
		justify-content: flex-end;
		/* Exits run natively on close(): the box leaves the top layer once the panel is gone. */
		transition:
			display var(--dur-exit-slow) allow-discrete,
			overlay var(--dur-exit-slow) allow-discrete;
	}
	.drawer:not([open]) {
		display: none;
	}
	.drawer[data-side='left'] {
		justify-content: flex-start;
	}
	.drawer::backdrop {
		background: rgba(0, 0, 0, 0.55);
		opacity: 0;
		transition:
			opacity var(--dur-exit) var(--ease-out),
			display var(--dur-exit) allow-discrete,
			overlay var(--dur-exit) allow-discrete;
	}
	.drawer[open]::backdrop {
		opacity: 1;
		transition-duration: var(--dur-base);
	}
	@starting-style {
		.drawer[open]::backdrop {
			opacity: 0;
		}
	}

	.panel {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: auto auto minmax(0, 1fr) auto;
		grid-template-areas:
			'head'
			'nav'
			'body'
			'foot';
		width: 100%;
		height: 100%;
		background: var(--overlay-fill);
		will-change: translate;
		padding-top: var(--safe-top);
		padding-bottom: var(--safe-bottom);
		--drawer-from: 100% 0;
		translate: var(--drawer-from);
		transition: translate var(--dur-exit-slow) var(--ease-drawer);
	}
	.drawer[data-side='left'] .panel {
		--drawer-from: -100% 0;
	}
	.drawer[open] .panel {
		translate: 0;
		transition-duration: var(--dur-sheet);
	}
	@starting-style {
		.drawer[open] .panel {
			translate: var(--drawer-from);
		}
	}

	.panel-head {
		grid-area: head;
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		padding: var(--sp-4);
		border-bottom: var(--edge-width) solid var(--surface-edge);
	}
	.panel-icon {
		display: inline-flex;
		flex: none;
		font-size: var(--icon-lg);
		color: var(--text-muted);
	}
	.panel-title {
		font-size: var(--fs-lg);
		font-weight: var(--fw-semibold);
	}
	.panel-page {
		color: var(--text-muted);
		font-size: var(--fs-sm);
	}
	.panel-page::before {
		content: '·';
		margin-right: var(--sp-2);
	}

	.panel-nav,
	.panel-nav-mobile {
		grid-area: nav;
		display: flex;
		gap: var(--sp-1);
		padding: var(--sp-2);
		border-bottom: var(--edge-width) solid var(--surface-edge);
		overflow-x: auto;
		scrollbar-width: thin;
	}
	.panel-nav.has-mobile {
		display: none;
	}

	.panel-body {
		grid-area: body;
		padding: var(--sp-4);
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}
	.panel-foot {
		grid-area: foot;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--sp-2);
		padding: var(--sp-4);
		border-top: var(--edge-width) solid var(--surface-edge);
	}

	@media (min-width: 48rem) {
		.panel {
			width: min(var(--drawer-w), 100%);
			padding-top: 0;
			padding-bottom: 0;
			border-left: var(--edge-width) solid var(--border-strong);
			box-shadow: var(--overlay-shadow);
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: auto minmax(0, 1fr) auto;
			grid-template-areas:
				'head'
				'body'
				'foot';
		}
		.drawer[data-side='left'] .panel {
			border-left: 0;
			border-right: var(--edge-width) solid var(--border-strong);
		}
		.panel.has-nav {
			grid-template-columns: var(--drawer-nav-w) minmax(0, 1fr);
			grid-template-areas:
				'head head'
				'nav body'
				'foot foot';
		}
		.panel-nav,
		.panel-nav.has-mobile {
			display: flex;
			flex-direction: column;
			overflow-x: hidden;
			overflow-y: auto;
			border-bottom: 0;
			border-right: var(--edge-width) solid var(--surface-edge);
		}
		.panel-nav-mobile {
			display: none;
		}
	}
</style>
