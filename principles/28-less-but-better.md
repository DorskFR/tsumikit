# Less, but better

Every element earns its place; if removing it loses nothing, remove it.

## Why

Dieter Rams's tenth principle, "good design is as little design as possible", and Nielsen heuristic 8, aesthetic and minimalist design: every extra element competes with the ones that matter. Restraint is what makes the remaining elements legible.
Sources: https://www.vitsoe.com/us/about/good-design , https://www.nngroup.com/articles/ten-usability-heuristics/

## Do

- Remove decoration that carries no information: borders, icons next to every label, redundant titles.
- Say things once; a page title does not need to be repeated in a breadcrumb and a heading.
- Prefer the plain version of a component until the richer one is justified.
- Review each screen by deleting elements one at a time and asking what was lost.

## Don't

- Add an icon to every button and a badge to every row.
- Show every field the backend has.
- Keep a feature on screen because it was expensive to build.

## In tsumikit

- Components default to the quiet form (`Button` `variant="default"`, `Card` without border, `Text` body) and take opt-in props for emphasis.
- Looks and micro-interactions are opt-in via `parseLook()` and `LookPicker`, not applied by default.
- Dev-audit warnings surface redundancy such as duplicate primaries and unlabelled controls.

## Check

For each element on the screen, hide it in dev tools. If the screen still answers "what is this, what state is it in, what can I do", the element was decoration.
