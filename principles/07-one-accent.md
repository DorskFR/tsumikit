# One accent, used sparingly

A single accent hue marks the primary action, the active item and focus; status colours mean status and nothing else.

## Why

Von Restorff effect: the one item that differs is the one noticed and remembered. An accent used everywhere signals nothing. Separating accent from green, amber and red keeps "here" distinct from "ok", "warning", "error".
Source: https://lawsofux.com/von-restorff-effect/

## Do

- Accent only on: the primary button, the active nav or tab, the focus ring, a selected row.
- Green, amber, red, blue only for semantic state; pair them with an icon or text.
- Keep counts, badges and chips neutral unless they carry state.

## Don't

- Colour every nav item or badge with the accent.
- Pick an accent that resembles one of the status colours.
- Use colour as the only carrier of meaning.

## In tsumikit

- `--accent`, `--accent-dim`, `--text-on-accent` for the single accent; themes keep the accent distinct from the status hues.
- Status tokens `--ok`, `--warn`, `--danger`, `--info`; `Badge`, `Dot`, `Callout` take a `tone` and always pair colour with an icon or label.
- `canonicalTone()` normalises tone names so there is one vocabulary.
- Lint rule `no-raw-color` keeps app styles on these tokens.

## Check

List every element using the accent colour. Each must be one of: primary action, active item, focus, selection. Then check every green, amber or red element has a non-colour cue beside it.
