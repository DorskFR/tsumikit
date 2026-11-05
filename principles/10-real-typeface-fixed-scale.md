# A real typeface, a fixed scale

Bundle a typeface designed for screens and use a fixed type scale with few weights.

## Why

Practical Typography and Refactoring UI: typography carries most of an interface. System font fallback changes the design per machine; a flat scale (heading same size as body) removes hierarchy. A typeface such as Inter, Geist or IBM Plex Sans is built for UI sizes.
Sources: https://practicaltypography.com/summary-of-key-rules.html , https://www.refactoringui.com/

## Do

- Bundle the font files with the app; do not depend on the user having the face installed.
- Use the kit's type scale and at most two body weights plus one bold for titles.
- Tighten letter-spacing slightly on large headings; never on body text.
- Use real typographic characters: an ellipsis, en dash, multiplication sign, curly quotes.

## Don't

- Set `font-family: system-ui` and hope.
- Introduce ad-hoc font sizes outside the scale.
- Use more than three weights on a page.

## In tsumikit

- Inter bundled via `styles/font.css`; `--font-sans` is the default stack, `--font-mono` for code.
- Type scale `--fs-2xs` (11) through `--fs-3xl` (36), scaled by `--fs-scale` (see `FontScalePicker`).
- Weights `--fw-normal`, `--fw-medium`, `--fw-semibold`, `--fw-bold`; line heights `--lh-heading`, `--lh-normal`.
- `Heading` and `Text` cover titles, body, labels, captions and eyebrows.
- Lint rule `no-raw-font` flags font-family or font-size literals in app styles.

## Check

Open dev tools on headings and body and list the font sizes in use. They must all be scale steps and the rendered family must be the bundled one, not a fallback. Count the weights: three at most.
