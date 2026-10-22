<script module>
	export const meta = {
		title: 'Tones, sizes and fills',
		caption: 'tone accent/success/info/warn/danger/neutral; size sm/md/lg; gradient, striped and color override the flat fill.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Progress } from '@dorsk/tsumikit';
</script>

<Progress value={65} label="Upload" showValue />
<Progress value={45} tone="success" label="Healthy usage" showValue />
<Progress value={55} tone="info" label="Syncing" showValue />
<Progress value={78} tone="warn" label="Warm usage" showValue />
<Progress value={94} tone="danger" label="Hot usage" showValue />
<Progress value={30} tone="neutral" label="Idle" showValue />
<Progress value={72} size="sm" label="Thin inline row" />
<Progress value={72} size="lg" label="Tall track" />
<Progress value={58} gradient label="Storage meter" />
<Progress value={40} striped label="Unpacking" />
<Progress value={40} gradient striped size="sm" label="Thin gradient striped" />
<Progress value={66} color="var(--c-violet)" label="Custom colour" />
