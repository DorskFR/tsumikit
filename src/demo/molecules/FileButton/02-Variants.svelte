<script module>
	export const meta = {
		title: 'Variants, sizes and icon-only',
		caption: 'variant default, primary, ghost; size sm, md, lg; control matches input height; iconOnly and box shrink it to a glyph with the label kept for assistive tech.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, FileButton, Input, toasts } from '@dorsk/tsumikit';

	const log = (f: File[]) => toasts.show(`${f.length} file(s): ${f.map((x) => x.name).join(', ')}`);
</script>

<Cluster>
	<FileButton label="Choose file" onfiles={log} />
	<FileButton label="Upload" variant="primary" icon="upload" onfiles={log} />
	<FileButton label="Attach" variant="ghost" onfiles={log} />
	<FileButton label="Avatar" emoji="🖼️" accept="image/*" onfiles={log} />
</Cluster>
<Cluster align="center">
	<FileButton label="Small" size="sm" onfiles={log} />
	<FileButton label="Medium" size="md" onfiles={log} />
	<FileButton label="Large" size="lg" onfiles={log} />
	<Input placeholder="Control height" aria-label="Control height" width="10rem" />
	<FileButton label="Beside an input" control onfiles={log} />
</Cluster>
<Cluster align="center">
	<FileButton label="Attach files" iconOnly multiple onfiles={log} />
	<FileButton label="Attach (xs)" box="xs" variant="ghost" onfiles={log} />
	<FileButton label="Attach (sm)" box="sm" variant="ghost" onfiles={log} />
	<FileButton label="Attach (md)" box="md" onfiles={log} />
	<FileButton label="Attach (lg)" box="lg" icon="image" variant="primary" onfiles={log} />
</Cluster>
