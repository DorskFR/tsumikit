<script lang="ts">
	import PullToRefresh from '../../src/lib/components/molecules/PullToRefresh.svelte';

	let {
		calls = $bindable(0),
		threshold = 72,
		disabled = false,
		fail = false,
		settle = $bindable<(() => void) | undefined>()
	}: {
		calls?: number;
		threshold?: number;
		disabled?: boolean;
		fail?: boolean;
		settle?: () => void;
	} = $props();

	function onrefresh() {
		calls += 1;
		if (fail) return Promise.reject(new Error('boom'));
		return new Promise<void>((resolve) => {
			settle = resolve;
		});
	}
</script>

<PullToRefresh {onrefresh} {threshold} {disabled} class="probe" style="height: 200px">
	<ul>
		{#each Array.from({ length: 40 }, (_, i) => i) as i (i)}
			<li>row {i}</li>
		{/each}
	</ul>
</PullToRefresh>
