# Empty states are design too

An empty list explains what belongs there and offers the action that fills it.

## Why

Nielsen heuristic 6, recognition over recall, and heuristic 10, help where it is needed: the first screen a new user sees is usually empty, and a blank area makes them guess whether something is broken or missing. The empty state is the onboarding.
Source: https://www.nngroup.com/articles/ten-usability-heuristics/

## Do

- Say what goes here in one sentence, in the user's words.
- Offer the one action that fills it as the primary button.
- Distinguish "nothing yet", "nothing matches your filter" and "failed to load"; each gets its own copy and action.
- Keep the layout stable: the empty state occupies the same region the content will.

## Don't

- Render an empty table header with no rows and no message.
- Show "No data" with no action.
- Use the same empty state for a filtered-to-nothing result as for a fresh account.

## In tsumikit

- `EmptyState` with `title`, `description`, `actionLabel` and `onAction` (or an `action` snippet for several).
- `Icon` for the illustration slot; `Callout` for the failed-to-load variant with a retry action.
- `FilterInput` and `FilterSearchBar` give a "clear filters" path for the filtered-empty case.

## Check

Reach every list and table on the screen in three states: new account, filter with no match, load failure. Each must show a message and an action that makes sense for that state.
