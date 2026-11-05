# Prefer undo over confirmation

Make actions reversible and offer an undo instead of asking "Are you sure?" beforehand.

## Why

Nielsen heuristic 3, user control and freedom: people need a clearly marked emergency exit. Confirmation dialogs are read once and then clicked through by habit, so they stop protecting anyone; undo protects every time.
Sources: https://www.nngroup.com/articles/ten-usability-heuristics/ , https://vercel.com/design/guidelines

## Do

- Perform the action, then show "Moved to trash. Undo" for a few seconds.
- Keep a confirm dialog only for truly irreversible or expensive actions (delete an account, send to many people), and name the consequence in the button ("Delete 12 files").
- Make Escape, Back and Cancel always available and always do what they say.

## Don't

- Ask "Are you sure?" with generic OK / Cancel buttons.
- Trap the user in a flow with no way out.
- Make Undo appear only in a hidden menu.

## In tsumikit

- `toasts.undo()` for the reversible pattern; `Toaster` renders the action and keeps it keyboard-reachable.
- `ConfirmModal` for the remaining irreversible cases, with a labelled destructive `Button` `variant="danger"`.
- `SwipeRow` exposes undoable row actions on touch.

## Check

Perform each destructive action on the screen. Either an undo appears for it, or a confirm names exactly what will be lost. "Are you sure?" with OK / Cancel is a failure.
