# Help where it is needed

Explanation appears next to the thing it explains, at the moment it is needed, and is short.

## Why

Nielsen heuristic 10: the best interface needs no documentation, but when help is needed it should be in context, searchable, focused on the task and concise. A manual nobody opens is not help.
Source: https://www.nngroup.com/articles/ten-usability-heuristics/

## Do

- Put one line of help text under the field it concerns.
- Use tooltips for icon-only controls and for the meaning of a term.
- Explain a setting's effect next to the setting, in the user's words.
- Link to deeper documentation from the place where the question arises.

## Don't

- Replace clear labels with a help icon.
- Write paragraphs where a sentence will do.
- Hide the only explanation in a separate help section.

## In tsumikit

- `Field` renders help and error text under its control and links it with `aria-describedby`.
- `Tooltip` for terse in-place help; `Popover` and `Disclosure` for a little more.
- `Callout` `tone="info"` for a short contextual note; `Prose` for longer documentation rendered from markdown.

## Check

Find every setting, field and icon-only control on the screen. For each, can a new user learn what it does without leaving the screen? If not, add one line of help there.
