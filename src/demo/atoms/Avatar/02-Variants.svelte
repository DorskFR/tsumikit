<script module>
	export const meta = {
		title: 'Sizes, shapes, tones and glyphs',
		caption: 'size xs, sm, md, lg or a pixel number; shape circle or square; tone accent, neutral or none replaces the hashed hue; glyph shows an emoji; seed and hue pin the colour.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Avatar, Cluster } from '@dorsk/tsumikit';
</script>

<Cluster align="center">
	<Avatar name="Amara Okafor" size="xs" />
	<Avatar name="Amara Okafor" size="sm" />
	<Avatar name="Amara Okafor" />
	<Avatar name="Amara Okafor" size="lg" />
	<Avatar name="Amara Okafor" size={56} />
</Cluster>
<Cluster align="center">
	<Avatar name="devbox" shape="square" size="sm" />
	<Avatar name="devbox" shape="square" />
	<Avatar name="devbox" shape="square" size="lg" glyph="🐙" />
	<Avatar name="laptop" shape="square" seed="acct-7f3" />
	<Avatar name="laptop" shape="square" hue={210} />
</Cluster>
<Cluster align="center">
	<Avatar name="Jun Tanaka" tone="accent" />
	<Avatar name="Jun Tanaka" tone="neutral" />
	<Avatar name="Jun Tanaka" tone="none" glyph="🦉" />
	<Avatar name="Élodie" />
	<Avatar name="🧑‍🚀 pilot" />
	<Avatar name="Jun Tanaka" style="--avatar-bg: var(--c-violet); --avatar-fg: var(--text-on-accent)" />
</Cluster>
