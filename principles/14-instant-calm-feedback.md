# Feedback is instant and calm

Respond at once, show a spinner only after a short delay and keep it long enough not to flicker, and update optimistically when success is likely.

## Why

Doherty threshold: under about 400 ms people stay in flow. A spinner that flashes for 50 ms makes a fast response feel broken; one that never appears makes a slow response feel dead. Optimistic updates keep the interface at the user's pace, with rollback as the safety net.
Sources: https://lawsofux.com/doherty-threshold/ , https://vercel.com/design/guidelines

## Do

- Wait about 200 ms before showing a loading indicator, then keep it for at least 500 ms.
- Apply likely-to-succeed changes immediately and roll back with a message on failure.
- Keep layout stable while loading: reserve space with skeletons, never shift content.
- Prefer in-place indicators over page-level overlays.

## Don't

- Show a spinner on every click regardless of duration.
- Block the whole page for a single row's update.
- Animate the loading state so much that it draws more attention than the content.

## In tsumikit

- `pending()` helper and `Button` `loadingDelay` / `loadingMin` implement the 200 ms / 500 ms rule; `loading="done"` shows the confirmation tick.
- `Skeleton`, `Spinner`, `Progress`, `LoadMore` for in-place loading.
- `toasts.error()` with an action for rollback messages; `toasts.undo()` for reversible changes.
- Motion tokens `--dur-fast`, `--dur-base`, `--ease-out` keep transitions short.

## Check

Throttle to a fast connection: no spinner should be visible at all. Throttle to slow 3G: a spinner appears once, stays at least half a second, and nothing on the page shifts when the data lands.
