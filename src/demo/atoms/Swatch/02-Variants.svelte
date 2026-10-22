<script module>
	export const meta = {
		title: 'Sizes and shapes',
		caption: 'size sm, md or lg; shape circle or square; any CSS colour or token.'
	};
</script>

<script lang="ts">
	import { Swatch } from '@dorsk/tsumikit';
</script>

<Swatch color="var(--accent)" size="sm" label="Accent small" />
<Swatch color="var(--accent)" label="Accent medium" />
<Swatch color="var(--accent)" size="lg" label="Accent large" />
<Swatch color="var(--ok)" shape="square" size="sm" label="Ok small" />
<Swatch color="var(--ok)" shape="square" label="Ok medium" />
<Swatch color="var(--ok)" shape="square" size="lg" label="Ok large" />
<Swatch color="hsl(200 80% 92%)" label="Pale blue" />
<Swatch color="linear-gradient(135deg, hsl(280 70% 60%), hsl(20 90% 60%))" shape="square" size="lg" label="Gradient" />
