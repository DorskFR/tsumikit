# Links are links, buttons are buttons

Navigation uses an anchor so middle-click, Cmd-click and "open in new tab" work; actions use a button.

## Why

Vercel and Rauno Freiberg interface guidelines, and Nielsen heuristic 4: users expect anything that navigates to behave like a link. A `div` with an onclick breaks the context menu, accessibility and the ability to open several things at once.
Sources: https://vercel.com/design/guidelines , https://interfaces.rauno.me/

## Do

- `<a href>` for anything that changes the URL; `<button>` for anything that does not.
- Style a link as a button when needed, but keep the anchor element.
- Make whole cards clickable with a single anchor, not a click handler on the container.
- Mark external links and give them accessible names.

## Don't

- Attach `onclick` navigation to a `div`, `span` or card.
- Use a button for "View details" that only navigates.
- Nest interactive elements inside the link.

## In tsumikit

- `Link` for text links and button-styled links; `Card` renders an anchor when given `href`.
- `NavItem`, `TabBar`, `Breadcrumb`, `Pagination`, `Tabs`, `SegmentedControl` take `href` and render real anchors.
- `AnchorAttributes` type carries the anchor props through.

## Check

Middle-click every navigational element on the screen. Each must open in a new tab. Right-click them: "Copy link address" must be present.
