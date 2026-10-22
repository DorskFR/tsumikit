<script module>
	export const meta = {
		title: 'Disabled control, rich hovercard, inline text',
		caption: 'a disabled button still gets its tooltip via the wrapper; a content snippet persists on hover (closeDelay) so you can copy; cursor and inline tune the wrapper.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, CopyButton, Dot, Text, Tooltip } from '@dorsk/tsumikit';
	import { services } from '../../fixtures';

	const gateway = services[0];
</script>

<Cluster align="center">
	<Tooltip text="Pick at least one service before deploying.">
		{#snippet trigger()}<Button variant="primary" disabled>Deploy</Button>{/snippet}
	</Tooltip>
	<Tooltip placement="bottom" closeDelay={400}>
		{#snippet trigger()}
			<button type="button" class="status" aria-label="{gateway.name} status">
				<Dot status="active" /><Text size="sm">{gateway.name}</Text>
			</button>
		{/snippet}
		{#snippet content()}
			<dl class="kv">
				<dt>region</dt><dd>{gateway.region}</dd>
				<dt>uptime</dt><dd>{gateway.uptimeDays} days</dd>
				<dt>build</dt><dd>7f3c9e2 <CopyButton text="7f3c9e2" box="xs" /></dd>
			</dl>
		{/snippet}
	</Tooltip>
</Cluster>
<Text size="sm">
	Retries use
	<Tooltip text="Each retry waits twice as long as the previous one, starting at 200 ms." inline cursor>
		{#snippet trigger()}<button type="button" class="term">exponential backoff</button>{/snippet}
	</Tooltip>
	with a cap of five attempts.
</Text>

<style>
	.status {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-2);
		padding: var(--sp-1) var(--sp-2);
		border: 1px solid var(--border);
		border-radius: var(--r-pill);
		background: var(--surface);
		color: inherit;
		font: inherit;
	}
	.kv {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--sp-1) var(--sp-3);
		margin: 0;
	}
	dt {
		color: var(--text-muted);
	}
	dd {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		margin: 0;
		font-family: var(--font-mono);
	}
	.term {
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-decoration: underline dotted;
	}
</style>
