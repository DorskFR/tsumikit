<script module>
	export const meta = {
		title: 'Active styles, badge tones and glyphs',
		caption: 'activeStyle="fill" | "bar"; badgeTone neutral, ok, warn, danger, info; the glyph comes from icon, iconPath or iconChildren.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { NavItem, Stack, Text } from '@dorsk/tsumikit';

	const tones = ['neutral', 'ok', 'warn', 'danger', 'info'] as const;
</script>

<Stack gap="var(--sp-1)">
	<Text size="xs" mono tone="muted">activeStyle="fill"</Text>
	<NavItem icon="music" label="Music" active badge={24} />
	<NavItem icon="tv" label="Shows" />
</Stack>
<Stack gap="var(--sp-1)">
	<Text size="xs" mono tone="muted">activeStyle="bar"</Text>
	<NavItem icon="film" label="Movies" active activeStyle="bar" badge={7} />
	<NavItem icon="book" label="Books" activeStyle="bar" />
</Stack>
<Stack gap="var(--sp-1)">
	<Text size="xs" mono tone="muted">badgeTone</Text>
	{#each tones as tone (tone)}
		<NavItem icon="bell" label="Alerts · {tone}" badge={4} badgeTone={tone} />
	{/each}
</Stack>
<Stack gap="var(--sp-1)">
	<Text size="xs" mono tone="muted">iconPath · iconChildren · href</Text>
	<NavItem
		iconPath="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
		label="Handbook"
	/>
	<NavItem label="Uptime">
		{#snippet iconChildren()}<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />{/snippet}
	</NavItem>
	<NavItem icon="external" label="Status page" href="#nav-item" />
</Stack>
