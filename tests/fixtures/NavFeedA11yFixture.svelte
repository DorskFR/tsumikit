<script lang="ts">
	import MasterDetail from '../../src/lib/components/layouts/MasterDetail.svelte';
	import NavItem from '../../src/lib/components/layouts/NavItem.svelte';
	import NavSection from '../../src/lib/components/layouts/NavSection.svelte';
	import Toolbar from '../../src/lib/components/layouts/Toolbar.svelte';

	let { selected = false, checked = 'b' }: { selected?: boolean; checked?: string } = $props();
</script>

<MasterDetail {selected} onback={() => {}}>
	{#snippet list()}
		{#each [1, 2, 3] as n (n)}<button type="button" class="row" id="row-{n}">Row {n}</button>{/each}
	{/snippet}
	{#snippet detail()}<p id="detail">Detail</p>{/snippet}
</MasterDetail>

<NavSection label="Projects">
	<NavItem label="Inbox" href="#inbox" badge={12} />
</NavSection>
<NavSection>
	<NavItem label="Plain" href="#plain" />
</NavSection>

<Toolbar label="Tools">
	<button type="button" id="t-first">First</button>
	{#each ['a', 'b', 'c'] as v (v)}
		<input type="radio" name="size" value={v} id="r-{v}" checked={checked === v} />
	{/each}
	<button type="button" id="t-last">Last</button>
</Toolbar>
