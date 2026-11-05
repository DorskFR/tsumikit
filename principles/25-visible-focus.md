# Every control shows a visible focus ring

Keyboard focus is always visible, on every interactive element, with a ring that contrasts with its surroundings.

## Why

WCAG 2.2 (2.4.7 focus visible, 2.4.11 focus not obscured) and the Vercel interface guidelines: keyboard users navigate by watching focus. Removing the outline without a replacement strands them. `:focus-visible` shows the ring only for keyboard focus, so pointer users are not bothered.
Sources: https://www.w3.org/WAI/WCAG22/quickref/ , https://vercel.com/design/guidelines

## Do

- Use `:focus-visible` with an accent ring at least 2px wide and an offset.
- Keep focus order the same as visual order.
- Move focus into dialogs on open and back to the trigger on close.
- Make the ring visible on dark and light surfaces and inside scroll containers.

## Don't

- Write `outline: none` without a replacement.
- Rely on a colour change alone to show focus.
- Let focus disappear behind a sticky header or an overlay.

## In tsumikit

- `--focus-ring`, `--focus-ring-width`, `--focus-ring-offset`, `--focus-ring-offset-inset` tokens; every atom applies them under `:focus-visible`.
- `Modal`, `Drawer`, `Menu`, `Popover` manage focus trapping and return.
- Roving focus for `Toolbar`, `RadioGroup`, `Tabs`, `Menu`.
- Dev-audit warnings flag unlabelled controls (`warnUnlabelled()`).

## Check

Tab through the entire screen from the address bar. At every stop you must see where focus is, in the order you expected, and nothing must be skipped or trapped.
