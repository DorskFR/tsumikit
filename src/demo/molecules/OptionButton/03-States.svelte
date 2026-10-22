<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled selected and unselected, a card with a long label and description wrapping, and a Badge-only card.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, OptionButton, Text } from '@dorsk/tsumikit';
</script>

<div class="grid">
	<OptionButton disabled selected><Text weight="semibold">Current plan</Text><Text size="xs" tone="muted">Team</Text></OptionButton>
	<OptionButton disabled><Text weight="semibold">Enterprise</Text><Text size="xs" tone="muted">Contact sales</Text></OptionButton>
	<OptionButton selected><Badge tone="ok">Recommended</Badge><Text weight="semibold">Pro</Text></OptionButton>
	<OptionButton
		description="Runs on a dedicated GPU node, keeps the monorepo warm between turns and streams tool output back to the parent session."
	>
		<Text weight="semibold">Overnight batch worker on the dedicated transcoding node</Text>
	</OptionButton>
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: var(--sp-2);
		max-width: 32rem;
	}
</style>
