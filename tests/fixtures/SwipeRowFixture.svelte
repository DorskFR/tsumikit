<script lang="ts">
	import SwipeRow from '../../src/lib/components/molecules/SwipeRow.svelte';

	let {
		fired = [] as string[],
		threshold = 0.35,
		withLeading = true,
		withTrailing = true,
		disabled = false
	}: {
		fired?: string[];
		threshold?: number;
		withLeading?: boolean;
		withTrailing?: boolean;
		disabled?: boolean;
	} = $props();

	const leadingAction = $derived(
		withLeading
			? { label: 'Archive', icon: 'check' as const, tone: 'ok' as const, onaction: () => fired.push('leading') }
			: undefined
	);
	const trailingAction = $derived(
		withTrailing
			? { label: 'Delete', icon: 'trash' as const, tone: 'danger' as const, onaction: () => fired.push('trailing') }
			: undefined
	);
</script>

<SwipeRow {leadingAction} {trailingAction} {threshold} {disabled}>
	<button type="button" class="probe-inner" onclick={() => fired.push('click')}>Row body</button>
</SwipeRow>
