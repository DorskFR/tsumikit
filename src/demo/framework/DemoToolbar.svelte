<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Badge, FontScalePicker, IconButton, Link, ThemePicker, Toolbar } from '@dorsk/tsumikit';
	import { base } from '$app/paths';
	import pkg from '../../../package.json';

	let {
		extras
	}: {
		/** Global controls contributed by other features (sound settings, motion toggle). */
		extras?: Snippet;
	} = $props();
</script>

<Toolbar label="Showcase settings" density="compact" class="demo-toolbar">
	<Link href="{base}/shell" class="cq-hide">AppShell</Link>
	<Link href="{base}/legacy" class="cq-hide" tone="muted">Legacy</Link>
	{@render extras?.()}
	<FontScalePicker box="sm" />
	<ThemePicker
		box="sm"
		auto
		autoLabel="Auto"
		autoHelp="Follows the system, with your last light and dark themes"
		placement="bottom-end"
	/>
	<IconButton
		href="https://github.com/DorskFR/tsumikit"
		target="_blank"
		rel="noopener noreferrer"
		icon="fork"
		label="Source on GitHub"
		box="sm"
	/>
	<Badge mono size="sm" class="cq-hide">v{pkg.version}</Badge>
</Toolbar>
