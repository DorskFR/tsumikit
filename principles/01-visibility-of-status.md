# Visibility of system status

Every action gets an acknowledgement within 100 ms, and the outcome is stated, not implied.

## Why

Nielsen heuristic 1: users forgive slowness but not silence; a button that goes quiet after a click gets clicked again or abandoned. The Doherty threshold adds the budget: below about 400 ms people stay in flow, above it they need visible progress.
Sources: https://www.nngroup.com/articles/ten-usability-heuristics/ , https://lawsofux.com/doherty-threshold/

## Do

- Change the control the moment it is pressed: keep its label, add a busy indicator next to it.
- State the result in words ("Saved. 3 fields updated."), and offer the way back when there is one.
- Show progress for anything that can take more than a second; show how much is done if you know.
- Mark long-running background work somewhere persistent (a status bar, a queue count).

## Don't

- Disable the button and show nothing else.
- Swap the label for a spinner, so the user forgets what they pressed.
- Report success only by closing the dialog.

## In tsumikit

- `Button` with `loading` (true while pending, `'done'` for the confirmation tick) and the `pending()` helper with `loadingDelay` / `loadingMin` for flicker-free timing.
- `Spinner`, `Progress`, `SegmentedProgress`, `Skeleton` for in-place state; `StatusBar` for persistent status.
- `Toaster` with `toasts.info()` / `toasts.error()` for outcome messages; errors use the assertive live region.
- Motion tokens `--dur-fast`, `--dur-base` keep the acknowledgement under the 100 ms threshold.

## Check

Click every action on the screen with the network throttled to "slow 3G". Within 100 ms something must change on or next to the control, and after completion the screen must say what happened.
