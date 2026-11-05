# One primary action per view

Each view has exactly one filled button, for the thing most people came to do; everything else is quieter or behind a menu.

## Why

Hick's law: decision time grows with the number and complexity of choices. Two filled buttons cancel each other out, and an action bar that wraps is a bar with too many actions.
Sources: https://lawsofux.com/hicks-law/ , Refactoring UI (hierarchy of actions) https://www.refactoringui.com/

## Do

- Filled accent for the primary action, outlined for secondary, plain text or icon-only for tertiary.
- Move rare or destructive actions into an overflow menu.
- Keep the primary action visible in the first viewport.

## Don't

- Fill two buttons in the same toolbar.
- Let an action bar wrap onto a second line.
- Give the primary slot to "Cancel" or "Back".

## In tsumikit

- `Button` `variant="primary"` for the one filled button; `variant="default"` for secondary, `variant="ghost"` or `IconButton` for tertiary.
- `SplitButton` when a primary action has variants; `Menu` for the overflow.
- `Toolbar` lays actions out with the shared control height.
- Lint rule `one-primary` flags more than one primary button in a view.

## Check

Count filled buttons in each viewport-sized region of the screen. The answer is one. Then shrink the window to 40rem: no action bar may wrap.
