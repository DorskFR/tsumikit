<script module>
	export const meta = {
		title: 'Aspect, radius and fallback',
		caption: 'aspect 1/1, 2/3 or 16/9; radius sm, md, lg or pill; fallback initials, icon or none; fit cover or contain.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Artwork, Cluster } from '@dorsk/tsumikit';
</script>

<Cluster align="flex-end">
	<Artwork alt="Square cover" size="5rem" />
	<Artwork alt="Poster" aspect="2/3" size="4rem" radius="sm" />
	<Artwork alt="Still frame" aspect="16/9" size="8rem" fallback="icon" icon="film" />
	<Artwork alt="Station" size="3.5rem" radius="pill" />
	<Artwork alt="Large radius" size="5rem" radius="lg" />
	<Artwork alt="" size="3rem" fallback="none" />
</Cluster>
<Cluster align="flex-end">
	<Artwork src="https://picsum.photos/seed/tsumikit/240" alt="Loaded cover" size="6rem" />
	<Artwork src="https://picsum.photos/seed/tsumikit/240" alt="Contained" size="6rem" aspect="16/9" fit="contain" />
	<Artwork src="https://picsum.photos/seed/tsumikit/240" alt="Pill photo" size="4rem" radius="pill" />
</Cluster>
