<script module>
	export const meta = {
		title: 'Pill and custom labels',
		caption: 'pill rounds the button; label, loadingLabel, errorLabel, retryLabel and doneLabel replace every string.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { LoadMore, toasts } from '@dorsk/tsumikit';
</script>

<LoadMore onload={() => toasts.show('Loading…')} />
<LoadMore pill label="Show 20 more" onload={() => toasts.show('Loading 20 more…')} />
<LoadMore state="loading" loadingLabel="Fetching older messages…" />
<LoadMore state="error" errorLabel="Could not reach the archive" retryLabel="Try again" onload={() => toasts.show('Retrying…')} />
<LoadMore state="done" doneLabel="You are all caught up" />
