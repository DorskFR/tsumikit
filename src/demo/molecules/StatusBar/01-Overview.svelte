<script module>
	export const meta = {
		title: 'CI job footer',
		caption: 'tone follows the job (idle → busy → ok / error), label names the step and trailing ticks the elapsed time. Every second run fails.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, StatusBar } from '@dorsk/tsumikit';

	const steps = ['Installing dependencies', 'Type-checking', 'Running 412 tests', 'Building'];
	let runs = $state(0);
	let ticks = $state(0);
	let running = $state(false);

	const step = $derived(Math.min(Math.floor(ticks / 3), steps.length - 1));
	const failed = $derived(!running && runs % 2 === 0);
	const tone = $derived(running ? 'busy' : runs === 0 ? 'idle' : failed ? 'error' : 'ok');
	const label = $derived(
		running ? `${steps[step]}…` : runs === 0 ? 'Waiting for a run' : failed ? `${steps[step]} failed` : 'All checks passed'
	);

	$effect(() => {
		if (!running) return;
		const timer = setInterval(() => {
			ticks += 1;
			if (ticks >= steps.length * 3) running = false;
		}, 300);
		return () => clearInterval(timer);
	});

	function run() {
		runs += 1;
		ticks = 0;
		running = true;
	}
</script>

<StatusBar {tone} {label}>
	{#snippet trailing()}
		{#if runs}<span>{(ticks * 0.3).toFixed(1)}s</span>{/if}
	{/snippet}
</StatusBar>
<div>
	<Button size="sm" variant="primary" loading={running} onclick={run}>Run pipeline</Button>
</div>
