<script lang="ts">
	import AttachmentList from '$lib/components/molecules/AttachmentList.svelte';
	import Breadcrumb from '$lib/components/molecules/Breadcrumb.svelte';
	import CapBar from '$lib/components/molecules/CapBar.svelte';
	import Composer from '$lib/components/molecules/Composer.svelte';
	import Dropzone from '$lib/components/molecules/Dropzone.svelte';
	import Metric from '$lib/components/molecules/Metric.svelte';
	import SectionHeader from '$lib/components/molecules/SectionHeader.svelte';
	import Timestamp from '$lib/components/molecules/Timestamp.svelte';

	let {
		onfiles = () => {},
		onchange = () => {},
		onmetric = () => {},
		onremove = () => {},
		cap = $bindable(80),
		maxItems = 0,
		crumbs = [],
		removeLabel,
		open = $bindable(true),
		metricHref,
		metricClick = false
	}: {
		onfiles?: (files: File[]) => void;
		onchange?: (cap: number | null) => void;
		onmetric?: () => void;
		onremove?: (i: number) => void;
		cap?: number | null;
		maxItems?: number;
		crumbs?: { label: string; href?: string }[];
		removeLabel?: string;
		open?: boolean;
		metricHref?: string;
		metricClick?: boolean;
	} = $props();
</script>

<div id="composer"><Composer onsubmit={() => {}} {onfiles} /></div>
<div id="dropzone">
	<Dropzone overlay {onfiles}><textarea id="dz-text"></textarea></Dropzone>
</div>
<div id="timestamp"><Timestamp value="2026-03-04T05:06:07Z" mode="short-iso" /></div>
<div id="section">
	<SectionHeader title="Queue" collapsible bind:open icon="search">
		<p>panel</p>
	</SectionHeader>
</div>
<div id="attachments">
	<AttachmentList files={[{ name: 'a.png', size: 10 }, { name: 'b.pdf', size: 20 }]} tiles={false} {onremove} {removeLabel} />
</div>
<div id="breadcrumb"><Breadcrumb items={crumbs} {maxItems} /></div>
<div id="capbar">
	<CapBar label="GPU" value={30} bind:cap {onchange} />
	<button id="reset-cap" type="button" onclick={() => (cap = 50)}>reset</button>
</div>
<div id="metric">
	<Metric layout="inline" label="Jobs" value={3} href={metricHref} onclick={metricClick ? onmetric : undefined} />
</div>
