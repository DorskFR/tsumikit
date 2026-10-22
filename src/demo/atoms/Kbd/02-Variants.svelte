<script module>
	export const meta = {
		title: 'Sizes and key tokens',
		caption: 'size sm, md or lg; keys as a + string or an array; named keys map to glyphs (enter ↵, shift ⇧, arrows).'
	};
</script>

<script lang="ts">
	import { Kbd } from '@dorsk/tsumikit';
</script>

<Kbd keys="mod+s" size="sm" />
<Kbd keys="mod+s" size="md" />
<Kbd keys="mod+s" size="lg" />
<Kbd keys={['ctrl', 'alt', 'delete']} />
<Kbd keys="shift+tab" />
<Kbd keys="space" />
<Kbd keys="up+down+left+right" />
<Kbd keys="meta+option" />
<Kbd keys="f5" />
