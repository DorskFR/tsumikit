<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
</script>

<div style="width: 1400px; padding: 40px;">
	<Card id="card" interactive onclick={() => {}}>
		<div style="display: flex; justify-content: space-between;">
			<button id="card-btn" type="button">toggle</button>
			<span id="card-body">body</span>
		</div>
	</Card>
	<Card id="row" interactive row padding="none" border="none" onclick={() => {}}>
		<div style="display: flex; justify-content: space-between;">
			<button id="row-btn" type="button">toggle</button>
			<span id="row-body">body</span>
		</div>
	</Card>
</div>
