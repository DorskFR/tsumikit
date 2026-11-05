<script lang="ts">
	import '@dorsk/tsumikit/styles/app.css';
	import {
		AppShell,
		Heading,
		Link,
		NavItem,
		THEME_PREPAINT,
		ThemePicker,
		Toaster,
	} from '@dorsk/tsumikit';
	import { page } from '$app/state';

	let { children } = $props();

	const nav = [
		{ href: '/', label: 'Home', icon: 'home' },
		{ href: '/items', label: 'Items', icon: 'list' },
	] as const;
	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<svelte:head>
	{@html `<script>${THEME_PREPAINT}</` + `script>`}
</svelte:head>

<AppShell stickySidebar navLabel="Main navigation">
	{#snippet header()}
		<Heading level={1} size="md">
			<Link href="/" tone="inherit" underline="none">Starter</Link>
		</Heading>
		<div class="header-end">
			<ThemePicker box="sm" auto autoLabel="Auto" placement="bottom-end" />
		</div>
	{/snippet}
	{#snippet sidebar()}
		{#each nav as item (item.href)}
			<NavItem href={item.href} label={item.label} icon={item.icon} active={isActive(item.href)} />
		{/each}
	{/snippet}
	<div class="content">
		{@render children()}
	</div>
</AppShell>
<Toaster />

<style>
	.header-end {
		margin-inline-start: auto;
	}
	.content {
		max-inline-size: 48rem;
		padding-block: var(--sp-4) var(--sp-10);
	}
</style>
