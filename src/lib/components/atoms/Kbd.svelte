<script lang="ts">
	import type { ControlSize } from '$lib/size';
	// Keyboard shortcut chip: `keys="mod+enter"` (or an array of tokens) renders
	// one <kbd> per key with platform-aware glyphs — `mod` is ⌘ on Mac, Ctrl
	// elsewhere (Ctrl during SSR).
	type Props = {
		keys: string | string[];
		size?: ControlSize;
		grow?: boolean;
		shrink?: boolean;
		block?: boolean;
		class?: string;
	};

	let { keys, size = 'sm', grow = false, shrink = true, block = false, class: klass = '' }: Props = $props();

	const isMac =
		typeof navigator !== 'undefined' &&
		/mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent || '');

	type Key = { glyph: string; name: string };
	const key = (glyph: string, name = glyph): Key => ({ glyph, name });

	function label(token: string): Key {
		const t = token.trim().toLowerCase();
		switch (t) {
			case 'mod':
				return isMac ? key('⌘', 'Command') : key('Ctrl', 'Control');
			case 'ctrl':
			case 'control':
				return key('Ctrl', 'Control');
			case 'meta':
			case 'cmd':
			case 'command':
				return key('⌘', 'Command');
			case 'alt':
			case 'option':
				return isMac ? key('⌥', 'Option') : key('Alt');
			case 'shift':
				return key('⇧', 'Shift');
			case 'enter':
			case 'return':
				return key('↵', 'Enter');
			case 'esc':
			case 'escape':
				return key('Esc', 'Escape');
			case 'tab':
				return key('Tab');
			case 'space':
				return key('Space');
			case 'up':
				return key('↑', 'Up arrow');
			case 'down':
				return key('↓', 'Down arrow');
			case 'left':
				return key('←', 'Left arrow');
			case 'right':
				return key('→', 'Right arrow');
			default:
				return key(t.charAt(0).toUpperCase() + t.slice(1));
		}
	}

	const tokens = $derived(
		(Array.isArray(keys) ? keys : keys.split('+')).filter((k) => k.trim() !== '').map(label)
	);
</script>

<span
	data-tsu="Kbd"
	class="kbd-group {klass}"
	class:kbd-md={size === 'md'}
	class:grow={grow}
	class:no-shrink={!shrink}
	class:block={block}
>
	{#each tokens as token, i (i)}
		{#if i > 0}<span class="kbd-sep" aria-hidden="true">+</span>{/if}
		<kbd class="kbd">{#if token.name === token.glyph}{token.glyph}{:else}<span aria-hidden="true">{token.glyph}</span><span class="kbd-name">{token.name}</span>{/if}</kbd>
	{/each}
</span>

<style>
	.grow {
		flex: 1 1 0;
		min-width: 0;
	}
	.no-shrink {
		flex: none;
	}
	.block {
		display: flex;
		width: 100%;
	}
	.kbd-group {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-0-5);
		font-size: var(--fs-xs);
		color: var(--text-muted);
		vertical-align: baseline;
	}
	.kbd-md {
		font-size: var(--fs-sm);
	}
	.kbd {
		font-family: var(--font-mono);
		font-size: inherit;
		line-height: var(--lh-snug);
		padding: 0 var(--sp-1);
		border: var(--edge-width) solid var(--border-strong);
		border-bottom-width: 2px;
		border-radius: var(--r-sm);
		background: var(--bg-elevated-2);
		color: inherit;
	}
	.kbd-name {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
	}
	.kbd-sep {
		font-size: var(--fs-2xs);
		color: var(--text-faint);
	}
</style>
