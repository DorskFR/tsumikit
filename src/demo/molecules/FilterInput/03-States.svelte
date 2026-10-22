<script module>
	export const meta = {
		title: 'States',
		caption: 'empty with a placeholder, hotkey="/" with showHotkey, showClear={false}, aria-invalid inside a Field with an error, and a long value clipping inside a narrow box.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Field, FilterInput } from '@dorsk/tsumikit';
	import { logSchema } from './data';

	let empty = $state('');
	let hotkey = $state('');
	let noClear = $state('level=info');
	let invalid = $state('status>=abc');
	let long = $state('message:"upstream connect error or disconnect/reset before headers. reset reason: connection timeout"');
</script>

<div class="states">
	<FilterInput schema={logSchema} bind:value={empty} placeholder="level=error service=api-gateway" />
	<FilterInput schema={logSchema} bind:value={hotkey} size="sm" shape="pill" surface="sunken" hotkey="/" showHotkey placeholder="Search" />
	<FilterInput schema={logSchema} bind:value={noClear} showClear={false} />
	<Field label="Saved filter" error="status must be a number">
		<FilterInput schema={logSchema} bind:value={invalid} aria-invalid="true" />
	</Field>
	<div class="narrow">
		<FilterInput schema={logSchema} bind:value={long} />
	</div>
</div>

<style>
	.states {
		display: grid;
		gap: var(--sp-3);
		max-width: 28rem;
	}
	.narrow {
		max-width: 14rem;
	}
</style>
