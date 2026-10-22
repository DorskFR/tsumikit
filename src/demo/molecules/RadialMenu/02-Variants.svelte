<script module>
	export const meta = {
		title: 'Tones, arcs and petal sizes',
		caption: 'tone colours the ring; arc {from,to} in degrees (0 = right, counter-clockwise); radius and petalSize are CSS lengths; scrim={false} drops the backdrop.',
	};
</script>

<script lang="ts">
	import { RadialMenu, Text, toasts, type MenuItem } from '@dorsk/tsumikit';

	const items: MenuItem[] = [
		{ label: 'Reply', icon: 'reply', onselect: () => toasts.show('Reply') },
		{ label: 'Star', icon: 'star', onselect: () => toasts.ok('Starred') },
		{ label: 'Share', icon: 'share', onselect: () => toasts.show('Share') },
		{ label: 'Archive', icon: 'archive', onselect: () => toasts.show('Archived') }
	];
</script>

<div class="grid">
	<figure>
		<RadialMenu label="Message actions" {items} tone="accent" />
		<figcaption><Text size="xs" tone="muted">accent · default arc</Text></figcaption>
	</figure>
	<figure>
		<RadialMenu label="Message actions" {items} tone="warn" icon="bell" arc={{ from: 180, to: 0 }} radius="6rem" />
		<figcaption><Text size="xs" tone="muted">warn · half circle · radius 6rem</Text></figcaption>
	</figure>
	<figure>
		<RadialMenu label="Message actions" {items} tone="neutral" icon="menu" petalSize="2.75rem" radius="6.5rem" />
		<figcaption><Text size="xs" tone="muted">neutral · petalSize 2.75rem</Text></figcaption>
	</figure>
	<figure>
		<RadialMenu label="Message actions" {items} tone="danger" icon="flame" closeIcon="x" scrim={false} arc={{ from: 90, to: 270 }} />
		<figcaption><Text size="xs" tone="muted">danger · no scrim · fans left</Text></figcaption>
	</figure>
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
		gap: var(--sp-4);
		width: 100%;
	}
	figure {
		display: grid;
		justify-items: center;
		gap: var(--sp-2);
		margin: 0;
		padding: var(--sp-5) var(--sp-2) var(--sp-2);
		border: 1px dashed var(--border);
		border-radius: var(--r-md);
	}
</style>
