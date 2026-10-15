<script lang="ts">
	import NavBar from '../../src/lib/components/layouts/NavBar.svelte';
	import type { NavBarItem } from '../../src/lib/components/layouts/NavBar.svelte';

	let {
		value = $bindable(),
		count = 4,
		links = false,
		withCenter = false,
		onchange,
		clicked = [] as string[],
		cancel = ''
	}: {
		value?: string;
		count?: number;
		links?: boolean;
		withCenter?: boolean;
		onchange?: (value: string) => void;
		clicked?: string[];
		cancel?: string;
	} = $props();

	const names = ['hud', 'map', 'camera', 'logs', 'more'];
	const items = $derived<NavBarItem[]>(
		names.slice(0, count).map((v, i) => ({
			label: v.toUpperCase(),
			icon: 'home',
			...(links ? { href: `#${v}`, current: i === 0 } : { value: v, controls: `panel-${v}` }),
			badge: v === 'logs' ? 3 : undefined,
			onclick: (e: MouseEvent) => {
				clicked.push(v);
				if (v === cancel) e.preventDefault();
			}
		}))
	);
</script>

{#snippet fab()}
	<button type="button" class="probe-fab">bot</button>
{/snippet}

<NavBar {items} label="Views" bind:value {onchange} center={withCenter ? fab : undefined} variant="floating" />
<p class="probe-value">{value ?? ''}</p>
