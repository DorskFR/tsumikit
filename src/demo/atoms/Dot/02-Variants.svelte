<script module>
	export const meta = {
		title: 'Presets, custom colours, glow and ring',
		caption: 'status picks a token colour, color overrides it with any CSS colour, glow adds a halo, ring a dark outline.'
	};
</script>

<script lang="ts">
	import { Dot } from '@dorsk/tsumikit';
</script>

<Dot status="active" label="active" />
<Dot status="stale" label="stale" />
<Dot status="dead" label="dead" />
<Dot status="hibernated" label="hibernated" />
<Dot color="var(--accent)" label="accent" />
<Dot color="var(--info)" label="info" />
<Dot color="hsl(300 70% 60%)" label="custom" />
<Dot status="active" glow label="glow" />
<Dot status="dead" ring label="ring" />
<Dot color="var(--warn)" glow ring label="both" />
