# Errors say what happened and what to do next

An error message names the problem in plain language, states the cause if known, and offers the next step.

## Why

Nielsen heuristic 9: help users recognise, diagnose and recover from errors. "Request failed with status code 500" tells the user nothing they can act on; "Couldn't reach the indexer. It timed out after 30 s. Check that it's running, then retry." tells them everything.
Source: https://www.nngroup.com/articles/ten-usability-heuristics/

## Do

- Lead with what the user wanted and could not get ("Couldn't save the profile").
- Add the cause in one short clause when you know it.
- Offer a concrete recovery: retry, edit the field, open settings.
- Place field errors next to the field and mark the field itself.

## Don't

- Surface raw exception text, status codes or stack traces.
- Blame the user ("Invalid input").
- Show the error in a place the user is no longer looking at.

## In tsumikit

- `Callout` `tone="error"` for inline errors with an action; `toasts.error()` with an action for transient ones (assertive live region).
- `Field` shows a field-level error next to its control and links it with `aria-describedby`.
- Status colour `--danger` always paired with the error icon and text.

## Check

Trigger each failure path on the screen (offline, bad input, server error). Every message must be understandable by someone who does not know what HTTP is, and must contain a next step.
