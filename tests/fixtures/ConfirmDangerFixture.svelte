<script lang="ts">
	import ConfirmModal from '$lib/components/molecules/ConfirmModal.svelte';
	let open = $state(true);
</script>

<ConfirmModal bind:open title="Delete this bookmark?" message="The saved text is gone for good." tone="danger" confirmLabel="Delete" onconfirm={() => {}} />
