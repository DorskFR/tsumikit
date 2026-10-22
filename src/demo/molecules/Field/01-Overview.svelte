<script module>
	export const meta = {
		title: 'Workspace settings form',
		caption: 'label, hint, error and a snippet hint; the wrapped Input, Select and Textarea pick up the label id automatically.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Field, Input, Kbd, Select, Textarea } from '@dorsk/tsumikit';

	let name = $state('Platform team');
	let slug = $state('platform team');
	let region = $state('eu-west-1');
	let notes = $state('');
	const slugError = $derived(/\s/.test(slug) ? 'Slugs cannot contain spaces.' : undefined);
</script>

<form class="form" onsubmit={(e) => e.preventDefault()}>
	<Field label="Workspace name" hint="Shown in the sidebar and in invitation emails.">
		<Input bind:value={name} />
	</Field>
	<Field label="URL slug" error={slugError} hint="Lowercase letters, digits and dashes.">
		<Input bind:value={slug} mono />
	</Field>
	<Field label="Primary region" hint="Where new projects are created by default.">
		<Select
			bind:value={region}
			options={[
				{ value: 'eu-west-1', label: 'Europe (Ireland)' },
				{ value: 'us-east-1', label: 'US East (Virginia)' },
				{ value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' }
			]}
		/>
	</Field>
	<Field label="Internal notes">
		{#snippet hint()}Visible to admins only. <Kbd keys="mod+enter" /> saves.{/snippet}
		<Textarea bind:value={notes} autoresize rows={2} submitOn="mod-enter" placeholder="Anything the next admin should know" />
	</Field>
	<Cluster justify="flex-end">
		<Button variant="ghost">Cancel</Button>
		<Button variant="primary" type="submit" disabled={!!slugError}>Save</Button>
	</Cluster>
</form>

<style>
	.form {
		display: grid;
		gap: var(--sp-3);
		max-width: 28rem;
	}
</style>
