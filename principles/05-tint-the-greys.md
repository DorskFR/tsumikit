# Tint your greys

Neutral greys look dead on screen; give every grey a slight shared hue so the whole page has one mood.

## Why

Refactoring UI: pure greys read as "admin panel". Saturating them a little, cool or warm, makes the palette feel intentional. Material's tonal surfaces follow the same idea: surfaces are tinted shades of one hue.
Sources: https://www.refactoringui.com/ , https://m3.material.io/foundations

## Do

- Pick one hue for the whole neutral ramp and tint backgrounds, borders and muted text with it.
- Keep lightness steps the same as a neutral ramp; only the hue changes.
- Let the accent colour and the grey tint come from nearby hues so they agree.

## Don't

- Use `#2a2a2a`-style neutral hexes.
- Mix cool greys in one component with warm greys in another.
- Hard-code any grey in a component; read it from the theme.

## In tsumikit

- Theme ramps `--c-bg`, `--c-bg-elev`, `--c-bg-elev-2`, `--c-surface`, `--c-border`, `--c-text-muted`, `--c-text-faint` are tinted per theme; components read the semantic aliases `--bg`, `--bg-elevated`, `--bg-elevated-2`, `--surface`, `--border`, `--text-muted`.
- `ThemePicker` and `chooseTheme()` switch the whole ramp at once; `Swatch` previews it.
- Lint rule `no-raw-color` rejects hex or rgb literals in app styles.

## Check

Sample three greys from a screenshot (background, card, border). Each must have non-zero saturation in HSL and the same hue family.
