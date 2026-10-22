<script module>
	export const meta = {
		title: 'Per-instance hooks from style',
		caption: '--btn-bg/fg/border, --btn-radius, --btn-size, --badge-bg, --txt-fg/size and --input-border/radius set inline on one element.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Button, Cluster, Input, Text } from '@dorsk/tsumikit';
</script>

<Cluster>
	<Button style="--btn-bg: var(--c-violet); --btn-fg: var(--c-bg); --btn-border: var(--c-violet)">Brand button</Button>
	<Button style="--btn-radius: 0">Square corners</Button>
	<Button style="--btn-size: 3rem">Tall</Button>
	<Badge style="--badge-bg: var(--info); --badge-fg: var(--text-on-accent); --badge-border: var(--info)">Beta</Badge>
	<Text style="--txt-fg: var(--c-gold); --txt-size: var(--fs-lg)">Gold text</Text>
</Cluster>
<Input placeholder="Pill input with a violet border" aria-label="Styled input" style="--input-border: var(--c-violet); --input-radius: var(--r-pill)" />
