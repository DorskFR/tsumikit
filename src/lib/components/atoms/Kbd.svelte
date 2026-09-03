<script lang="ts">
	// Keyboard shortcut chip: `keys="mod+enter"` (or an array of tokens) renders
	// one <kbd> per key with platform-aware glyphs — `mod` is ⌘ on Mac, Ctrl
	// elsewhere (Ctrl during SSR).
	type Props = {
		keys: string | string[];
		size?: 'sm' | 'md';
		class?: string;
	};

	let { keys, size = 'sm', class: klass = '' }: Props = $props();

	const isMac =
		typeof navigator !== 'undefined' &&
		/mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent || '');

	function label(token: string): string {
		const t = token.trim().toLowerCase();
		switch (t) {
			case 'mod':
				return isMac ? '⌘' : 'Ctrl';
			case 'ctrl':
			case 'control':
				return 'Ctrl';
			case 'meta':
			case 'cmd':
			case 'command':
				return '⌘';
			case 'alt':
			case 'option':
				return isMac ? '⌥' : 'Alt';
			case 'shift':
				return '⇧';
			case 'enter':
			case 'return':
				return '↵';
			case 'esc':
			case 'escape':
				return 'Esc';
			case 'tab':
				return 'Tab';
			case 'space':
				return 'Space';
			case 'up':
				return '↑';
			case 'down':
				return '↓';
			case 'left':
				return '←';
			case 'right':
				return '→';
			default:
				return t.charAt(0).toUpperCase() + t.slice(1);
		}
	}

	const tokens = $derived(
		(Array.isArray(keys) ? keys : keys.split('+')).filter((k) => k.trim() !== '').map(label)
	);
</script>

<span data-tsu="Kbd" class="kbd-group {klass}" class:kbd-md={size === 'md'}>
	{#each tokens as token, i (i)}
		{#if i > 0}<span class="kbd-sep" aria-hidden="true">+</span>{/if}
		<kbd class="kbd">{token}</kbd>
	{/each}
</span>

<style>
	.kbd-group {
		display: inline-flex;
		align-items: center;
		gap: 2px;
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
		line-height: 1.4;
		padding: 0 var(--sp-1);
		border: 1px solid var(--border-strong);
		border-bottom-width: 2px;
		border-radius: var(--r-sm);
		background: var(--bg-elevated-2);
		color: inherit;
	}
	.kbd-sep {
		font-size: 0.85em;
		color: var(--text-faint);
	}
</style>
