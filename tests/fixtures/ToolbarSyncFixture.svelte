<script lang="ts">
	import Toolbar from '../../src/lib/components/layouts/Toolbar.svelte';

	let { disabled = false, hidden = false }: { disabled?: boolean; hidden?: boolean } = $props();
</script>

<Toolbar label="Tools" collapseBelow="400px" items={[{ label: 'C', onselect: () => {} }]}>
	<button type="button" id="a" {disabled}>A</button>
	<button type="button" id="b" {hidden}>B</button>
	<button type="button" id="c" data-overflow>C</button>
</Toolbar>
