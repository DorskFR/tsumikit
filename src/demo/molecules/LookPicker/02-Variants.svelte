<script module>
	export const meta = {
		title: 'Sizes, subsets and experimental looks',
		caption: 'size sm/md; looks restricts and orders the choices; experimental={false} hides experimental looks; experimentalLabel renames their badge; block fills the width.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { LookPicker } from '@dorsk/tsumikit';
</script>

<LookPicker size="sm" />
<LookPicker />
<LookPicker looks={['default', 'depth']} label="Depth or not" />
<LookPicker experimental={false} />
<LookPicker experimentalLabel="lab" block />
