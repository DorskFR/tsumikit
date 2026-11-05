# Depth from shade, not outlines

Layers are told apart by background lightness and soft shadow; borders are faint or absent.

## Why

Refactoring UI and Apple's dark-mode guidance: in dark themes the base is near black and each level above it is a few percent lighter. When every panel has a strong border, the borders become the loudest thing on the page and the content loses.
Sources: https://www.refactoringui.com/ , https://developer.apple.com/design/human-interface-guidelines/

## Do

- Stack `--bg` < `--bg-elevated` < `--bg-elevated-2` < `--surface` as you go up.
- Use a single light direction for shadows and keep them soft.
- Reserve visible borders for inputs and for cases where two equal-lightness areas must be separated.

## Don't

- Put a 1px solid border on every card, table and panel.
- Combine a strong border with a shadow on the same element.
- Lighten text and darken background in the same step; adjust one at a time.

## In tsumikit

- Elevation tokens `--bg`, `--bg-elevated`, `--bg-elevated-2`, `--surface`; `--border` for faint lines, `--border-strong` only where needed.
- Shadow tokens `--shadow-sm`, `--shadow-md`, `--shadow-lg`.
- `Card` reads surface fill and edge from `--surface-fill` / `--surface-edge`; look tokens `--raised-fill`, `--overlay-fill` cover popovers and menus.

## Check

Desaturate a screenshot and count the borders. Each one should be doing something spacing or shade could not. Layers must still read as layers with all borders hidden.
