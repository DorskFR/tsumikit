<script module>
	export const meta = {
		title: 'States',
		caption: 'sound={false} with a title tooltip, hitArea="compact" in a dense row, shrink={false} in a squeezed flex row, and a long option label in row form.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, SelectButton } from '@dorsk/tsumikit';

	const opts = [
		{ value: 'a', label: 'Auto' },
		{ value: 'long', label: 'Every build artefact for the lifetime of the project' }
	];
	let v = $state('a');
</script>

<Cluster align="center">
	<SelectButton glyph="A" label="Text size" title="Text size (sound off)" sound={false} value={v} options={opts} onchange={(x) => (v = x)} />
	<SelectButton glyph="A" label="Compact" box="xs" hitArea="compact" value={v} options={opts} onchange={(x) => (v = x)} />
	<SelectButton glyph="A" label="Compact" box="xs" hitArea="compact" value={v} options={opts} onchange={(x) => (v = x)} />
</Cluster>
<div class="squeeze">
	<span class="filler"></span>
	<SelectButton shrink={false} glyph="⚙" label="Pinned" value={v} options={opts} onchange={(x) => (v = x)} />
</div>
<div class="narrow">
	<SelectButton variant="row" block glyph="⚙" label="Retention" value="long" options={opts} onchange={(x) => (v = x)} />
</div>

<style>
	.squeeze {
		display: flex;
		gap: var(--sp-2);
		max-width: 12rem;
	}
	.filler {
		flex: 1 1 20rem;
		height: 2.25rem;
		border-radius: var(--r-sm);
		background: var(--bg-elevated);
	}
	.narrow {
		max-width: 12rem;
	}
</style>
