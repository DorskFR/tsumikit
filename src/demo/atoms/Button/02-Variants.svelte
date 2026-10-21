<script module>
	export const meta = {
		title: 'Variants, tones and sizes',
		caption: 'variant picks the chrome, tone the colour, size the height; pill rounds it, control matches input height.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Text } from '@dorsk/tsumikit';
</script>

<Cluster>
	<Button>Default</Button>
	<Button variant="primary">Primary</Button>
	<Button variant="ghost">Ghost</Button>
	<Button variant="danger">Delete</Button>
	<Button variant="link">Learn more</Button>
</Cluster>
<Cluster>
	<Button tone="accent">Notify me</Button>
	<Button tone="success">Approve</Button>
	<Button tone="info">Cold start</Button>
	<Button tone="warn">Retry</Button>
	<Button tone="warn" control>Send <Text numeric>0:09</Text></Button>
</Cluster>
<Cluster align="center">
	<Button size="sm">Small</Button>
	<Button size="md">Medium</Button>
	<Button size="lg">Large</Button>
	<Button control>Control height</Button>
	<Button pill>Pill</Button>
	<Button pill variant="primary" size="sm">Pill small</Button>
</Cluster>
