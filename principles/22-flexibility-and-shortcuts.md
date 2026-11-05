# Shortcuts for the experienced, defaults for the rest

Frequent actions get accelerators (keyboard, bulk, saved filters) that newcomers can ignore.

## Why

Nielsen heuristic 7, flexibility and efficiency of use: the same interface serves first-time and expert users. Experts want fewer steps; novices want fewer choices. Shortcuts layered on top of a simple default serve both.
Source: https://www.nngroup.com/articles/ten-usability-heuristics/

## Do

- Add keyboard shortcuts for the top actions and show them in tooltips and menus.
- Allow bulk selection and bulk actions on lists.
- Let filters, sort and views be saved or shared via the URL.
- Support paste, drag and drop and type-ahead wherever they make sense.

## Don't

- Make shortcuts the only way to do something.
- Override browser or OS shortcuts.
- Hide bulk actions until a user discovers multi-select by accident.

## In tsumikit

- `Kbd` to display shortcuts; `Menu` items show them inline; `Tooltip` for hover hints.
- `FilterInput` with the `filters` query grammar for saved, shareable filters; `urlState()` keeps them in the URL.
- `Dropzone`, `FileButton` and `Composer` for drag, drop and paste; `SortableList` for keyboard-reorderable lists.

## Check

Do the three most frequent tasks on the screen without a mouse. Each should take fewer keystrokes than clicks. The shortcuts must be visible somewhere on the screen.
