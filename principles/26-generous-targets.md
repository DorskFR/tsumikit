# Generous targets

Interactive elements are at least 24px with a pointer and 44px on touch, with no dead zones between them.

## Why

Fitts's law: time to hit a target depends on its size and distance; frequent targets should be big and close. WCAG 2.2 (2.5.8) sets the 24px minimum, mobile platform guidance sets 44px. Gaps between adjacent targets prevent mis-taps.
Sources: https://lawsofux.com/fittss-law/ , https://www.w3.org/WAI/WCAG22/quickref/

## Do

- Make the whole row or card the target, not just the text inside it.
- Pad icon buttons to the touch size even when the icon is small.
- Put frequent actions near where the pointer or thumb already is.
- Leave at least 8px between adjacent targets.

## Don't

- Ship 16px icon buttons with no padding.
- Make the hit area smaller than the visible shape.
- Place a destructive action within thumb reach of a frequent one on mobile.

## In tsumikit

- `--touch-target` (44px) and `--touch-target-compact` (40px); `--control-height` variants for desktop density.
- `IconButton` and `Button` pad to the target size; `TabBar` and `SwipeRow` are built for thumbs.
- `AppShell` places primary navigation at the bottom on narrow screens.

## Check

Overlay 44px squares on a phone screenshot and 24px on a desktop one. Every interactive element must contain one. Tap between two neighbouring targets: one of them must respond, never neither.
