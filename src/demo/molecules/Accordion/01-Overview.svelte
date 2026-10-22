<script module>
	export const meta = {
		title: 'Billing FAQ',
		caption: 'items with title and content snippets; multiple={false} closes the others when one opens.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Accordion, Text } from '@dorsk/tsumikit';
</script>

{#snippet cycle()}
	<Text size="sm">Usage is metered per token and invoiced on the first of each month. Caps reset on the schedule shown next to each provider.</Text>
{/snippet}
{#snippet cap()}
	<Text size="sm">Drag the cap bar on the provider row. Sessions pause when the cap is hit and resume at the next reset.</Text>
{/snippet}
{#snippet refund()}
	<Text size="sm">Unused prepaid credit is refunded in full within 14 days of purchase. Metered usage is not refundable.</Text>
{/snippet}

<div class="faq">
	<Accordion
		multiple={false}
		items={[
			{ id: 'cycle', title: 'When am I billed?', content: cycle, open: true },
			{ id: 'cap', title: 'How do I set a spending cap?', content: cap },
			{ id: 'refund', title: 'Can I get a refund?', content: refund }
		]}
	/>
</div>

<style>
	.faq {
		max-width: 36rem;
	}
</style>
