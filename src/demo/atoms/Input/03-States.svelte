<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled, readonly, invalid, a filled clearable input, a long value that scrolls and a native password field.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Field, Input } from '@dorsk/tsumikit';

	let query = $state('postgres-primary');
</script>

<Cluster>
	<Input disabled value="worker-02" aria-label="Disabled" />
	<Input readonly value="eu-west-1" aria-label="Region" />
	<Input invalid value="not an email" aria-label="Invalid" />
	<Input type="password" value="hunter2hunter2" aria-label="Password" />
</Cluster>
<Cluster>
	<Input bind:value={query} icon="search" clearable placeholder="Filter services" aria-label="Filter services" />
	<Input
		width="14rem"
		value="/var/lib/postgresql/16/main/pg_wal/000000010000000000000042"
		mono
		aria-label="Long path"
	/>
</Cluster>
<div style="max-width: 24rem">
	<Field label="Webhook URL" error="Must start with https://.">
	<Input value="http://hooks.example.com/abc" icon="link" />
</Field>
</div>
