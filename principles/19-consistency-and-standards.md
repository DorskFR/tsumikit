# Consistency beats local cleverness

The same thing looks and behaves the same everywhere, and works the way users expect from the apps they already use.

## Why

Nielsen heuristic 4 and Jakob's law: users spend most of their time in other applications and bring those expectations with them. Every local deviation is something to learn, and every inconsistency is a moment of doubt.
Sources: https://www.nngroup.com/articles/ten-usability-heuristics/ , https://lawsofux.com/jakobs-law/

## Do

- Reuse the kit component for a job rather than restyling a near copy.
- Keep one vocabulary: the same action has the same label and icon on every screen.
- Follow platform conventions for selection, navigation, keyboard shortcuts and dialogs.
- Put the same things in the same place on every page.

## Don't

- Build a one-off button, input or table because the kit's was "almost right".
- Use "Remove" here and "Delete" there for the same action.
- Change the primary button's position between pages.

## In tsumikit

- Atoms are the only place raw controls live; molecules compose them. Lint rule `no-raw-control` flags raw `button`, `input` and `select` in app code.
- Theme and look tokens (`--r-control`, `--control-height`, `--btn-fill`) make every control share shape and size.
- `canonicalTone()` and the `Tone` vocabulary unify status naming across components.
- Lint rule `breakpoints` keeps media queries on the shared 40rem / 48rem / 64rem steps.

## Check

Take screenshots of the same component type across three pages and lay them side by side. They must be indistinguishable in shape, size and behaviour.
