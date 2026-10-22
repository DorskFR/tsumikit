<script module>
	export const meta = {
		title: 'Tappable, interactive, link and empty slot',
		caption: 'tap on a native button or anchor adds the press affordance; interactive makes a div keyboard-operable while nested buttons stay independent; a dashed card marks an empty drop slot.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Button, Card, Heading, Text, toasts } from '@dorsk/tsumikit';

	let opened = $state(0);
</script>

<Card tap as="button" onclick={() => opened++}>
	<Heading level={3} size="sm">Tappable button card</Heading>
	<Text size="sm" tone="muted">Pressed {opened} times.</Text>
</Card>
<Card tap as="a" href="#card">
	<Heading level={3} size="sm">Anchor card</Heading>
	<Text size="sm" tone="muted">The whole surface is a link.</Text>
</Card>
<Card interactive onclick={() => toasts.show('Card activated')} gap="var(--sp-2)">
	<Heading level={3} size="sm">Interactive card</Heading>
	<Text size="sm" tone="muted">Enter or Space activates; the nested button does not bubble.</Text>
	<Button size="sm" variant="ghost" onclick={() => toasts.show('Nested button')}>Nested action</Button>
</Card>
<Card border="dashed" surface="sunken" style="display: grid; place-items: center; min-height: 7rem">
	<Text size="sm" tone="muted">Drop a widget here</Text>
</Card>
