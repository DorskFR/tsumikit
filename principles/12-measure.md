# Keep lines between 45 and 75 characters

Body text runs 45 to 75 characters per line so the eye finds the next line without effort.

## Why

Practical Typography: lines shorter than about 45 characters break the rhythm; longer than about 75, the eye loses its place on the return sweep. Line length matters more than font size for reading comfort.
Source: https://practicaltypography.com/summary-of-key-rules.html

## Do

- Cap reading columns with a max width in `ch` or `rem`, independent of the viewport.
- Raise line height slightly as lines get longer.
- On wide screens, add columns or margins rather than stretching the text.

## Don't

- Let descriptions, prose or form help text run the full width of a 1600px window.
- Shrink the font to make long lines fit.

## In tsumikit

- `--measure` sets the default reading width; `--content-max` caps page content.
- `Prose` and `EmptyState` descriptions are measure-limited; `Container` constrains layouts.
- Line-height tokens `--lh-normal`, `--lh-snug`.

## Check

Count characters on a full line of body text at the widest supported viewport. Between 45 and 75.
