<script lang="ts">
	// Application frame: sticky header, optional sidebar, main content, optional
	// footer — all supplied as snippets. Responsive by default:
	//   • desktop (≥ 48rem): the sidebar is a persistent grid column.
	//   • mobile: the sidebar becomes an off-canvas drawer that slides in over a
	//     scrim; AppShell renders the hamburger toggle for you (shown only on
	//     mobile), locks body scroll while open, closes on Escape / scrim click,
	//     and marks the rest of the page `inert` so focus stays in the drawer.
	// Switching to desktop auto-closes the drawer. Safe-area insets are honored.
	import type { Snippet } from 'svelte';
	import { browser } from '$app/environment';
	import IconButton from '$lib/components/molecules/IconButton.svelte';

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
		sidebarWidthKey
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
	} = $props();

	let open = $state(false);
	let isMobile = $state(false);

	// --- resizable sidebar (desktop) ---
	function loadW(): number | null {
		if (!browser || !sidebarWidthKey) return null;
		const n = Number(localStorage.getItem(sidebarWidthKey));
		return Number.isFinite(n) && n >= minSidebar ? Math.min(n, maxSidebar) : null;
	}
	let sideW = $state<number | null>(loadW());
	let dragging = $state(false);
	let rafId = 0;
	let lastX = 0;
	function startDrag(e: PointerEvent) {
		dragging = true;
		lastX = e.clientX;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		e.preventDefault();
	}
	function onDrag(e: PointerEvent) {
		if (!dragging) return;
		lastX = e.clientX;
		if (rafId) return;
		rafId = requestAnimationFrame(() => {
			rafId = 0;
			sideW = Math.round(Math.max(minSidebar, Math.min(lastX, maxSidebar)));
		});
	}
	function endDrag(e: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = 0;
		}
		try {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		} catch {
			/* already released */
		}
		if (browser && sidebarWidthKey && sideW != null) localStorage.setItem(sidebarWidthKey, String(sideW));
	}
	// The effective desktop width: a resized px value wins over the prop default.
	const widthCss = $derived(resizableSidebar && sideW != null ? `${sideW}px` : sidebarWidth);

	$effect(() => {
		if (!browser) return;
		const mq = window.matchMedia('(max-width: 47.999rem)');
		const sync = () => {
			isMobile = mq.matches;
			if (!isMobile) open = false; // desktop: drawer concept doesn't apply
		};
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
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
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="shell" class:dragging style="--shell-sidebar-w: {widthCss}">
	<header class="shell-header">
		{#if sidebar}
			<IconButton
				class="shell-menu-btn"
				icon="menu"
				label="Toggle navigation"
				aria-expanded={open}
				onclick={() => (open = !open)}
			/>
		{/if}
		{@render header?.()}
	</header>

	{#if sidebar}
		<button
			class="shell-scrim"
			class:show={open && isMobile}
			tabindex="-1"
			aria-hidden="true"
			onclick={() => (open = false)}
		></button>
		<aside
			class="shell-sidebar"
			class:open
			aria-label={navLabel}
			inert={isMobile && !open ? true : undefined}
		>
			{@render sidebar()}
			{#if resizableSidebar}
				<div
					class="shell-sidebar-resize"
					role="separator"
					aria-label="Resize sidebar"
					aria-orientation="vertical"
					onpointerdown={startDrag}
					onpointermove={onDrag}
					onpointerup={endDrag}
					onpointercancel={endDrag}
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
		min-height: 100dvh;
		display: grid;
		grid-template-columns: 1fr;
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
		height: var(--header-h);
		padding-inline: max(var(--sp-4), var(--safe-left)) max(var(--sp-4), var(--safe-right));
		padding-top: var(--safe-top);
		background: color-mix(in srgb, var(--bg) 88%, transparent);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--border);
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
		-webkit-overflow-scrolling: touch;
		background: var(--bg-elevated);
		border-right: 1px solid var(--border);
		padding: var(--sp-3);
		padding-top: max(var(--sp-3), var(--safe-top));
		padding-bottom: max(var(--sp-3), var(--safe-bottom));
		/* A query container named `sidebar` so nav items collapse to an icon rail
		   based on the sidebar's own width (see NavItem). */
		container: sidebar / inline-size;
		transform: translateX(-100%);
		transition: transform 0.2s var(--ease);
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
			grid-template-columns: var(--shell-sidebar-w) 1fr;
			grid-template-areas:
				'header header'
				'sidebar main'
				'footer footer';
		}
		.shell-sidebar {
			position: relative; /* anchor the absolute resize handle */
			grid-area: sidebar;
			transform: none;
			z-index: auto;
			box-shadow: none;
			border-right: 1px solid var(--border);
		}
		.shell-scrim,
		:global(.shell-menu-btn) {
			display: none !important;
		}
		.shell-sidebar-resize {
			display: block;
			position: absolute;
			top: 0;
			bottom: 0;
			right: 0;
			width: 10px;
			margin-right: -5px;
			cursor: ew-resize;
			touch-action: none;
			z-index: 1;
		}
		.shell-sidebar-resize::after {
			content: '';
			position: absolute;
			top: 0;
			bottom: 0;
			right: 5px;
			width: 1px;
			background: transparent;
			transition: background 0.12s var(--ease);
		}
		.shell-sidebar-resize:hover::after,
		.shell.dragging .shell-sidebar-resize::after {
			background: var(--accent);
		}
	}
</style>
