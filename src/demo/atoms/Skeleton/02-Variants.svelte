<script module>
	export const meta = {
		title: 'Bars, circles and paragraphs',
		caption: 'width and height take any length; circle follows height; lines stacks bars with a shorter last one; radius rounds the corners.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Skeleton } from '@dorsk/tsumikit';
</script>

<Cluster align="center">
	<Skeleton circle height="24px" />
	<Skeleton circle height="40px" />
	<Skeleton circle height="64px" />
	<Skeleton width="4rem" height="4rem" radius="var(--r-md)" />
	<Skeleton width="6rem" height="2rem" radius="var(--r-pill)" />
</Cluster>
<Skeleton width="40%" height="1.5em" />
<Skeleton lines={4} />
<Skeleton width="100%" height="8rem" radius="var(--r-lg)" />
