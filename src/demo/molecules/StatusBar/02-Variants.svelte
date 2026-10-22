<script module>
	export const meta = {
		title: 'Tones',
		caption: 'tone="idle" | "busy" | "ok" | "warn" | "error"; busy swaps the dot for a spinner.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { StatusBar } from '@dorsk/tsumikit';
</script>

<StatusBar tone="idle" label="Idle" />
<StatusBar tone="busy" label="Assistant is typing…">
	{#snippet trailing()}<span>12s</span>{/snippet}
</StatusBar>
<StatusBar tone="ok" label="Connected to dev1" />
<StatusBar tone="warn" label="Reconnecting (attempt 3 of 5)" />
<StatusBar tone="error" label="Disconnected" />
