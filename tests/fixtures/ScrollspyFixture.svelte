<script>
	import { createScrollspy } from '../../src/demo/framework/scrollspy.svelte';

	/** @type {{ ids: string[], hidden: string[], query: string }} */
	let { ids, hidden, query } = $props();

	const spy = createScrollspy({
		sections: () => [...document.querySelectorAll('[data-spy]')].filter((el) => el instanceof HTMLElement && !el.hidden).map((el) => /** @type {HTMLElement} */ (el)),
		line: () => 50,
		deps: () => [query, hidden]
	});
</script>

<output data-active={spy.active}></output>
{#each ids as id (id)}
	<section {id} data-spy hidden={hidden.includes(id)}></section>
{/each}
