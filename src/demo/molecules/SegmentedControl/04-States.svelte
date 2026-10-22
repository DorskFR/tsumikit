<script module>
	export const meta = {
		title: 'States and counts',
		caption: 'a disabled segment is skipped by arrow keys; no initial value picks the first enabled one; string counts render verbatim.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { SegmentedControl, type SegmentOption } from '@dorsk/tsumikit';

	const envs: SegmentOption[] = [
		{ value: 'dev', label: 'Development' },
		{ value: 'staging', label: 'Staging', count: '99+' },
		{ value: 'prod', label: 'Production', count: 'frozen', disabled: true }
	];
	let picked = $state<string | undefined>();
	let env = $state<string | undefined>('staging');
</script>

<SegmentedControl options={envs} bind:value={picked} label="Environment, no initial value" />
<SegmentedControl options={envs} bind:value={env} label="Environment" />
