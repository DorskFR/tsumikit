<script lang="ts">
	// Application frame: sticky header, optional sidebar, main content, optional
	// footer — all supplied as snippets. Responsive by default:
	//   • desktop (≥ 64rem): the sidebar is a persistent grid column.
	//   • tablet (48–64rem): the column narrows to an icon rail
	//     (--shell-rail-w, default 4.5rem); the `sidebar` container query lets
	//     nav content collapse to icons.
	//   • mobile: the sidebar becomes an off-canvas drawer that slides in over a
	//     scrim; AppShell renders the hamburger toggle for you (shown only on
	//     mobile), locks body scroll while open, closes on Escape / scrim click /
	//     a same-origin link click inside it, and marks the rest of the page
	//     (all but the hamburger) `inert`. Opening focuses the first control in
	//     the drawer; closing returns focus to the toggle. `bind:open` to drive it.
	// Switching to desktop auto-closes the drawer. Safe-area insets are honored;
	// `--shell-header-h` is the rendered header height (incl. the top inset).
	import { untrack, type Snippet } from 'svelte';
	import { browser } from '$lib/env';
	import { readStorage, writeStorage } from '$lib/stores/storage';
	import IconButton from '$lib/components/molecules/IconButton.svelte';
	import { resizeHandle } from './resizable-panel-frame.js';

	let {
		header,
		sidebar,
		footer,
		children,
		sidebarWidth = '16rem',
		navLabel = 'Main navigation',
		resizableSidebar = false,
		minSidebar = 64,
		maxSidebar = 360,
		sidebarWidthKey,
		layout = 'header-top',
		stickySidebar = false,
		sidebarPadding = 'md',
		open = $bindable(false),
		onOpenChange,
		closeOnNavigate = true,
		class: klass = '',
		style: styleProp = '',
	}: {
		header?: Snippet;
		sidebar?: Snippet;
		footer?: Snippet;
		children: Snippet;
		/** Initial / non-resizable desktop sidebar width (any CSS length). */
		sidebarWidth?: string;
		navLabel?: string;
		/** Drag the sidebar's right edge on desktop to resize it. Below ~8rem the
		 *  nav collapses to an icon rail automatically (see NavItem, driven by the
		 *  `sidebar` container query — no JS state needed). */
		resizableSidebar?: boolean;
		minSidebar?: number;
		maxSidebar?: number;
		/** localStorage key to persist the resized width. */
		sidebarWidthKey?: string;
		/** `'sidebar-full'`: the sidebar spans the whole height on desktop/tablet
		 *  and the header only covers the content column (brand sits top-left). */
		layout?: 'header-top' | 'sidebar-full';
		/** Pin the desktop sidebar to the viewport (100dvh, own scroll) so its
		 *  footer stays visible on long pages. */
		stickySidebar?: boolean;
		/** Inner padding of the sidebar; `'none'` when the nav owns its gutters. */
		sidebarPadding?: 'none' | 'sm' | 'md';
		/** Mobile drawer state; reset to `false` when the viewport reaches 48rem. */
		open?: boolean;
		/** Fires when AppShell itself opens or closes the drawer. */
		onOpenChange?: (open: boolean) => void;
		/** Close the mobile drawer when a same-origin link inside it is clicked
		 *  (plain left click, no modifier keys, no `target` / `download`). */
		closeOnNavigate?: boolean;
		class?: string;
		style?: string;
	} = $props();

	let isMobile = $state(false);
	let aside = $state<HTMLElement>();
	let menuBtn = $state<HTMLElement>();
	let asideW = $state(0);

	function setOpen(next: boolean) {
		if (open === next) return;
		open = next;
		onOpenChange?.(next);
	}

	function onSidebarClick(e: MouseEvent) {
		if (!closeOnNavigate || !open) return;
		if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		const link = (e.target as Element | null)?.closest?.('a[href]');
		if (!link) return;
		const target = link.getAttribute('target');
		if ((target && target !== '_self') || link.hasAttribute('download')) return;
		let url: URL;
		try {
			url = new URL(link.getAttribute('href') ?? '', document.baseURI);
		} catch {
			return;
		}
		if (url.origin !== location.origin) return;
		setOpen(false);
	}

	// --- resizable sidebar (desktop) ---
	function loadW(): number | null {
		if (!browser || !sidebarWidthKey) return null;
		const n = Number(readStorage(sidebarWidthKey));
		return Number.isFinite(n) && n >= minSidebar ? Math.min(n, maxSidebar) : null;
	}
	let sideW = $state<number | null>(loadW());
	let dragging = $state(false);
	function persistW(w: number) {
		if (browser && sidebarWidthKey) writeStorage(sidebarWidthKey, String(w));
	}
	const measureW = () => sideW ?? aside?.getBoundingClientRect().width ?? 0;
	// The effective desktop width: a resized px value wins over the prop default.
	const widthCss = $derived(resizableSidebar && sideW != null ? `${sideW}px` : sidebarWidth);
	$effect(() => {
		if (!resizableSidebar || !aside) return;
		void widthCss;
		asideW = Math.round(measureW());
	});

	$effect(() => {
		if (!browser) return;
		const mq = window.matchMedia('(max-width: 47.999rem)');
		const sync = () => {
			isMobile = mq.matches;
			if (!isMobile) setOpen(false);
		};
		untrack(sync);
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	$effect(() => {
		const el = aside;
		if (!el) return;
		el.addEventListener('click', onSidebarClick);
		return () => el.removeEventListener('click', onSidebarClick);
	});

	// Lock body scroll while the mobile drawer is open.
	$effect(() => {
		if (!browser) return;
		document.body.style.overflow = open && isMobile ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	});

	// Background is inert (untabbable, hidden from AT) when the drawer is open.
	const bgInert = $derived(open && isMobile);

	const FOCUSABLE =
		'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
	let wasInert = false;
	$effect(() => {
		const active = bgInert;
		if (active === wasInert) return;
		wasInert = active;
		untrack(() => {
			if (active) {
				aside?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
				return;
			}
			const current = document.activeElement;
			if (current && current !== document.body && !aside?.contains(current)) return;
			menuBtn?.querySelector<HTMLElement>('button')?.focus();
		});
	});
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && setOpen(false)} />

<div
	class="shell {klass}"
	class:dragging
	class:sidebar-full={layout === 'sidebar-full'}
	class:sticky-sidebar={stickySidebar}
	style="--shell-sidebar-w: {widthCss}; {styleProp}"
	data-tsu="AppShell"
>
	<header class="shell-header">
		{#if sidebar}
			<!-- Wrapper owned here so the responsive hide is a scoped rule on our own
			     element, not a :global reach into the IconButton's button. -->
			<div class="shell-menu-btn" bind:this={menuBtn}>
				<IconButton
					icon="menu"
					label="Toggle navigation"
					aria-expanded={open}
					onclick={() => setOpen(!open)}
				/>
			</div>
		{/if}
		<div class="shell-header-content" inert={bgInert || undefined}>
			{@render header?.()}
		</div>
	</header>

	{#if sidebar}
		<button
			class="shell-scrim"
			class:show={open && isMobile}
			tabindex="-1"
			aria-hidden="true"
			onclick={() => setOpen(false)}
		></button>
		<aside
			class="shell-sidebar"
			class:open
			data-padding={sidebarPadding}
			aria-label={navLabel}
			inert={isMobile && !open ? true : undefined}
			bind:this={aside}
		>
			{@render sidebar()}
			{#if resizableSidebar}
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					class="shell-sidebar-resize"
					role="separator"
					tabindex="0"
					aria-label="Resize sidebar"
					aria-orientation="vertical"
					aria-valuemin={minSidebar}
					aria-valuemax={maxSidebar}
					aria-valuenow={sideW ?? asideW}
					use:resizeHandle={{
						side: 'left',
						min: minSidebar,
						max: maxSidebar,
						measure: measureW,
						onwidth: (w) => (sideW = w),
						oncommit: persistW,
						onactive: (active) => (dragging = active)
					}}
				></div>
			{/if}
		</aside>
	{/if}

	<main class="shell-main" inert={bgInert || undefined}>
		{@render children()}
	</main>

	{#if footer}
		<footer class="shell-footer" inert={bgInert || undefined}>{@render footer()}</footer>
	{/if}
</div>

<style>
	.shell {
		--shell-header-h: calc(var(--header-h) + var(--safe-top));
		min-height: 100dvh;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: auto 1fr auto;
		grid-template-areas:
			'header'
			'main'
			'footer';
	}
	.shell-header {
		grid-area: header;
		position: sticky;
		top: 0;
		z-index: var(--z-header);
		display: flex;
		align-items: center;
		gap: var(--sp-3);
		min-width: 0;
		height: var(--shell-header-h);
		padding-inline: max(var(--sp-4), var(--safe-left)) max(var(--sp-4), var(--safe-right));
		padding-top: var(--safe-top);
		background: color-mix(in srgb, var(--bg) 88%, transparent);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--border);
	}
	.shell-header > :global(*) {
		min-width: 0;
	}
	.shell-header-content {
		display: contents;
	}
	.shell-header-content > :global(*) {
		min-width: 0;
	}
	.shell-menu-btn {
		display: inline-flex;
		align-items: center;
	}
	.shell-main {
		grid-area: main;
		min-width: 0; /* let content shrink instead of overflowing the grid */
		/* A query container named `main` so content components can respond to the
		   content width (which changes when the sidebar is resized), not the
		   viewport. */
		container: main / inline-size;
	}
	.shell-footer {
		grid-area: footer;
		border-top: 1px solid var(--border);
		padding: var(--sp-4) max(var(--sp-4), var(--safe-right)) calc(var(--sp-4) + var(--safe-bottom))
			max(var(--sp-4), var(--safe-left));
	}

	/* Mobile: sidebar is an off-canvas drawer. */
	.shell-sidebar {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		width: min(var(--shell-sidebar-w), 82vw);
		z-index: var(--z-drawer);
		overflow-y: auto;
		overflow-x: hidden; /* overflow-y:auto would otherwise make x auto too */
		-webkit-overflow-scrolling: touch;
		background: var(--bg-elevated);
		border-right: 1px solid var(--border);
		--shell-sidebar-pad: var(--sp-3);
		padding: var(--shell-sidebar-pad);
		padding-top: max(var(--shell-sidebar-pad), var(--safe-top));
		padding-bottom: max(var(--shell-sidebar-pad), var(--safe-bottom));
		/* A query container named `sidebar` so nav items collapse to an icon rail
		   based on the sidebar's own width (see NavItem). */
		container: sidebar / inline-size;
		transform: translateX(-100%);
		transition: transform 0.2s var(--ease);
	}
	.shell-sidebar[data-padding='sm'] {
		--shell-sidebar-pad: var(--sp-2);
	}
	.shell-sidebar[data-padding='none'] {
		--shell-sidebar-pad: 0px;
	}
	.shell-sidebar.open {
		transform: translateX(0);
		box-shadow: var(--shadow-lg);
	}
	.shell-scrim {
		display: none;
		position: fixed;
		inset: 0;
		z-index: calc(var(--z-drawer) - 1);
		background: rgba(0, 0, 0, 0.5);
		border: 0;
		cursor: pointer;
	}
	.shell-scrim.show {
		display: block;
	}

	/* Resize handle lives only on the desktop persistent column. */
	.shell-sidebar-resize {
		display: none;
	}
	.shell.dragging {
		user-select: none;
		cursor: ew-resize;
	}

	/* Desktop: persistent sidebar column; hide drawer chrome. */
	@media (min-width: 48rem) {
		.shell {
			grid-template-columns: var(--shell-sidebar-w) minmax(0, 1fr);
			grid-template-areas:
				'header header'
				'sidebar main'
				'footer footer';
		}
		.shell.sidebar-full {
			grid-template-areas:
				'sidebar header'
				'sidebar main'
				'sidebar footer';
		}
		.shell-sidebar {
			position: relative; /* anchor the absolute resize handle */
			grid-area: sidebar;
			transform: none;
			z-index: auto;
			box-shadow: none;
			border-right: 1px solid var(--border);
		}
		.shell.sticky-sidebar .shell-sidebar {
			position: sticky;
			top: 0;
			height: 100dvh;
			align-self: start;
		}
		.shell-scrim,
		.shell-menu-btn {
			display: none !important;
		}
		.shell-sidebar-resize {
			display: block;
			position: absolute;
			top: 0;
			bottom: 0;
			right: 0;
			width: 10px;
			cursor: ew-resize;
			touch-action: none;
			z-index: 1;
		}
		/* Persistent grip hint (mirrors the Modal): a small pill centered on the
		   handle, brightening to the accent on hover / while dragging. */
		.shell-sidebar-resize::after {
			content: '';
			position: absolute;
			top: 50%;
			right: 1px;
			transform: translateY(-50%);
			width: 3px;
			height: 28px;
			border-radius: 999px;
			background: var(--border-strong);
			transition: background 0.12s var(--ease);
		}
		.shell-sidebar-resize:hover::after,
		.shell-sidebar-resize:focus-visible::after,
		.shell.dragging .shell-sidebar-resize::after {
			background: var(--accent);
		}
		.shell-sidebar-resize:focus-visible {
			outline: 2px solid var(--accent);
			outline-offset: -2px;
		}
	}

	/* Tablet: the persistent column narrows to an icon rail so the content and
	   header keep room; the `sidebar` container query collapses nav content. */
	@media (min-width: 48rem) and (max-width: 63.999rem) {
		.shell {
			grid-template-columns: var(--shell-rail-w, 4.5rem) minmax(0, 1fr);
		}
		.shell-sidebar {
			width: auto;
		}
		.shell-sidebar-resize {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.shell-sidebar {
			transition: none;
		}
	}
</style>
