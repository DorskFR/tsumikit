<script lang="ts">
	// Column layout for a chat panel: header, the feed (flexes), status row,
	// composer. Layout only.
	import type { Snippet } from 'svelte';

	let {
		header,
		children,
		status,
		composer,
		class: klass = '',
		style: styleProp = ''
	}: {
		header?: Snippet;
		/** The feed; fills the space between header and status. */
		children: Snippet;
		status?: Snippet;
		composer?: Snippet;
		class?: string;
		style?: string;
	} = $props();
</script>

<section data-tsu="ConversationPanel" class="panel {klass}" style={styleProp}>
	{#if header}<header class="panel-header">{@render header()}</header>{/if}
	<div class="panel-body">{@render children()}</div>
	{#if status}<div class="panel-status">{@render status()}</div>{/if}
	{#if composer}<div class="panel-composer">{@render composer()}</div>{/if}
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		min-width: 0;
		height: 100%;
		background: var(--surface);
	}
	.panel-header {
		flex: none;
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
		padding: var(--sp-2) var(--sp-3);
		border-bottom: 1px solid var(--border);
	}
	.panel-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}
	.panel-status {
		flex: none;
		border-top: 1px solid var(--border);
	}
	.panel-composer {
		flex: none;
		padding: var(--sp-2) var(--sp-3) var(--sp-3);
		border-top: 1px solid var(--border);
	}
	.panel-status + .panel-composer {
		border-top: 0;
	}
</style>
