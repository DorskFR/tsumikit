<script module>
	export const meta = {
		title: 'Game HUD bottom bar',
		caption: 'items fan out above the bar; icon, caption and tone style the FAB; status is a line centred above the open arc.',
		layout: 'center',
		height: '14rem'
	};
</script>

<script lang="ts">
	import { Dot, RadialMenu, Text, toasts, type MenuItem } from '@dorsk/tsumikit';

	let armed = $state(true);
	const items: MenuItem[] = [
		{ label: 'Disarm', icon: 'stop', danger: true, onselect: () => { armed = false; toasts.error('Bot disarmed'); } },
		{ label: 'Mode', icon: 'settings', onselect: () => toasts.show('Mode: explore') },
		{ label: 'Go zone', icon: 'arrow-right', onselect: () => toasts.show('Heading to zone B') },
		{ label: 'Sell all', icon: 'tag', disabled: true },
		{ label: 'Recover', icon: 'plus', onselect: () => { armed = true; toasts.ok('Recovered'); } }
	];
</script>

<div class="phone">
	<div class="bar">
		<span>HUD</span>
		<span>Map</span>
		<RadialMenu label="Bot actions" {items} icon="zap" caption="● bot" tone={armed ? 'ok' : 'danger'}>
			{#snippet status()}
				<Text size="sm"><Dot status={armed ? 'active' : 'dead'} /> {armed ? 'Armed · explore · zone A' : 'Disarmed'}</Text>
			{/snippet}
		</RadialMenu>
		<span>Camera</span>
		<span>Logs</span>
	</div>
</div>

<style>
	.phone {
		display: flex;
		align-items: flex-end;
		width: min(100%, 22rem);
		height: 12rem;
		border: 1px solid var(--border);
		border-radius: var(--r-lg);
		background: var(--bg);
	}
	.bar {
		display: grid;
		grid-template-columns: 1fr 1fr auto 1fr 1fr;
		align-items: end;
		justify-items: center;
		width: 100%;
		padding: var(--sp-2);
		border-top: 1px solid var(--border);
		color: var(--text-muted);
		font-size: var(--fs-sm);
	}
</style>
