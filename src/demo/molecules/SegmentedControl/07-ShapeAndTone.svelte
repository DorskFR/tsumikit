<script module>
	export const meta = {
		title: 'Square tiles and toned selection',
		caption: 'shape="square" lays the options out as small-radius tiles with a neutral ring; a per-option tone or color rings the selected one in its colour.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { SegmentedControl, type SegmentOption } from '@dorsk/tsumikit';

	const targets: SegmentOption[] = [
		{ value: 'dev', label: 'Development', icon: 'git-branch', tone: 'info' },
		{ value: 'staging', label: 'Staging', icon: 'clock', tone: 'warn' },
		{ value: 'prod', label: 'Production', icon: 'zap', tone: 'danger' }
	];
	const channels: SegmentOption[] = [
		{ value: 'stable', label: 'Stable', tone: 'ok' },
		{ value: 'beta', label: 'Beta', color: 'var(--c-violet)' },
		{ value: 'plain', label: 'Untoned' }
	];
	let target = $state('staging');
	let channel = $state('stable');
</script>

<SegmentedControl shape="square" block options={targets} bind:value={target} label="Deploy target" />
<SegmentedControl shape="square" options={channels} bind:value={channel} label="Release channel" />
<SegmentedControl options={channels} bind:value={channel} label="Release channel (pill)" />
