# The URL is state

Filters, tabs, sort and pagination live in the URL so they survive refresh, Back and sharing.

## Why

Vercel and Rauno Freiberg interface guidelines: a view a user cannot link to or return to is lost work. Back must restore both the view and its scroll position; a pasted link must open the same thing the sender saw.
Sources: https://vercel.com/design/guidelines , https://interfaces.rauno.me/

## Do

- Encode the active tab, filter query, sort column and page in the query string or path.
- Restore scroll position on Back and Forward.
- Make the active state of tabs and segments come from the URL, not from component memory.
- Use `replaceState` for typed-ahead changes and `pushState` for navigational ones.

## Don't

- Keep tab or filter state only in a store that resets on refresh.
- Reset to page 1 and clear filters when the user presses Back.
- Encode state that is not shareable (a hover, an open menu).

## In tsumikit

- `urlState()` binds a value to a query parameter.
- `Tabs`, `SegmentedControl` and `Pagination` accept `href` per item so the active state is a real link.
- `FilterInput` with `serialize()` and `parse()` round-trips filter queries through the URL.

## Check

Set a filter, switch a tab, go to page 3, then refresh and press Back twice. Every step must restore exactly what was on screen, and the URL at each step must open the same view in a new window.
