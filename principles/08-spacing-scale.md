# A spacing scale, and more room than feels right

All spacing comes from a fixed scale; start with too much whitespace, then remove some.

## Why

Refactoring UI: cramped layouts feel cheap even when every pixel is correct, and arbitrary gaps make a page look accidental. A scale (4, 8, 12, 16, 24, 32, 48, 64) with no in-between values keeps rhythm consistent without thought.
Source: https://www.refactoringui.com/

## Do

- Use scale steps for padding, gaps and margins; jump a step rather than nudging by 2px.
- Give cards and sections generous inner padding (16 or 24), and larger gaps between sections than inside them.
- Align every element to an edge, grid or baseline that other elements also use.

## Don't

- Use 10px, 14px, 18px or other off-scale values.
- Use the same gap everywhere; it flattens grouping (see "Group with space").
- Reach for `margin-top: 3px` to fix alignment; fix the line height or the scale step.

## In tsumikit

- Spacing tokens `--sp-1` (4px) through `--sp-12` (48px), with `--sp-0-5` and `--sp-1-5` for hairline cases.
- Layouts `Stack`, `Cluster`, `AutoGrid`, `Container` take gaps from the scale; `--content-max` caps reading width.
- Lint rule `spacing-scale` flags raw pixel spacing in app styles.

## Check

Inspect padding and gap values on the screen; every one must be a scale step. Then double the main gaps in dev tools; if it looks better, the original was too tight.
