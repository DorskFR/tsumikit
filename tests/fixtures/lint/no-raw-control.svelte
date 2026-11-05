<script>
	import { Button, Input } from '@dorsk/tsumikit';
</script>

<button type="button">raw</button>
<input type="text" />
<select><option>a</option></select>
<textarea></textarea>
<input type="hidden" name="csrf" />
<Button>atom</Button>
<Input />
<!-- tsumikit-lint-ignore no-raw-control -->
<button>allowed</button>
