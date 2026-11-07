# Sound

[Back to the README](../README.md)

UI sound effects are **off by default** and nothing is loaded while they stay off:
no audio code, no `AudioContext`, no listeners. The user opts in with
`<SoundSettings />` (a speaker popover with an on/off switch, a volume slider and a
preview button; `size="sm"` for toolbars) or your own UI bound to the `sound` store.
The choice persists in `localStorage` under `tsumikit-sound`.

```svelte
<script>
	import { Button, SoundSettings, sound } from '@dorsk/tsumikit';
</script>

<SoundSettings size="sm" />
<Button sound={false}>Silent button</Button>
<Button onclick={() => sound.play('success')}>Play success</Button>
```

- **Palette**: `click` (buttons, selections, menu items), `toggle-on` / `toggle-off`
  (Switch, Checkbox, Toggle), `open` / `close` (Modal, Drawer, Popover, Menu,
  Accordion…), `success` / `error` (ok and error toasts, CopyButton), `tick` (slider
  steps, pull-to-refresh threshold). Every sound is a short soft synth tone, under
  120 ms for interactions and under 160 ms for `success` / `error`; nothing is hover
  driven.
- **Per instance**: every hooked component takes `sound={false}` to stay silent.
- **Your events**: `sound.play('success' | 'error' | …)` goes through the same gates
  (enabled, volume, hidden tab, user activation), so an app can fire feedback on its
  own saves and failures.
- **Reduced motion**: with `prefers-reduced-motion: reduce` only `success` and
  `error` play; decorative sounds are muted. `sound.muted` tells why nothing plays
  (`'off' | 'reduced-motion' | null`) and `SoundSettings` shows it as a hint.
- **Weight**: the synth is a separate lazy chunk of about 0.7 KB gzipped, imported
  on the first play (or when the setting is turned on, so a gesture can unlock audio
  on Safari). What components import is a ~0.3 KB gate plus the store.
- Calls within one frame coalesce (the highest priority wins: error > success >
  open/close > toggle > click > tick) and the same sound plays at most once per 50 ms.
