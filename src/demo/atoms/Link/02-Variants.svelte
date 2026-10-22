<script module>
	export const meta = {
		title: 'Tones and underlines',
		caption: 'tone accent, info, muted or inherit; underline always, hover or none.'
	};
</script>

<script lang="ts">
	import { Link, Text } from '@dorsk/tsumikit';
</script>

<Link href="#link">Accent</Link>
<Link href="#link" tone="info">Info</Link>
<Link href="#link" tone="muted">Muted</Link>
<Text tone="warn">Warn text with an <Link href="#link" tone="inherit">inherited link</Link></Text>
<Link href="#link" underline="always">Always underlined</Link>
<Link href="#link" underline="hover">Underline on hover</Link>
<Link href="#link" underline="none">Never underlined</Link>
