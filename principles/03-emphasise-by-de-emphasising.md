# Emphasise by de-emphasising

Make the important thing stand out by making everything around it quieter, not bigger.

## Why

Refactoring UI: hierarchy is built with weight and colour first, size last. When every element shouts, nothing does. Three text levels are enough for most screens: a title, values, labels.
Source: https://www.refactoringui.com/

## Do

- Title: large and bold. Value: normal weight, full contrast. Label: small, muted.
- Lower the contrast of supporting text instead of raising the size of primary text.
- Keep muted text at or above 4.5:1 contrast; faint text is for placeholders and disabled states only.

## Don't

- Use size alone to signal importance.
- Use four or more text styles on one card.
- Push secondary text so faint that it fails contrast.

## In tsumikit

- Text colour levels: `--text` for values, `--text-muted` for labels (>= 4.5:1), `--text-faint` for placeholder and disabled text only (~3:1).
- `Heading` for titles; `Text` with `tone="muted"` for labels and `variant="caption"` for small supporting copy.
- Weight tokens `--fw-normal`, `--fw-medium`, `--fw-semibold`, `--fw-bold`; size tokens `--fs-xs` to `--fs-3xl`.
- `KeyValue`, `Metric`, `StatTile` already encode the title / value / label structure.

## Check

Squint at the screen (or blur a screenshot). You should see one title, a few strong values, and quiet labels. Run a contrast check on muted text: 4.5:1 or better.
