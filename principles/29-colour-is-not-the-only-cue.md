# Colour is never the only cue

State conveyed by colour is also conveyed by an icon, a label or a shape.

## Why

WCAG 1.4.1 (use of colour): about one in twelve men cannot reliably distinguish red from green. A dot that is green or red is a dot. Pairing colour with text or an icon also helps everyone in bad light or on a poor display.
Source: https://www.w3.org/WAI/WCAG22/quickref/

## Do

- Pair every status colour with a word or an icon ("Failed", a cross).
- Use shape or position as well as colour in charts and legends.
- Underline or otherwise mark links in running text.
- Test with a colour-blind-safe theme or a simulator.

## Don't

- Show a bare coloured dot as the only indicator of health.
- Distinguish chart series by hue alone.
- Mark required fields by colour only.

## In tsumikit

- `Badge`, `Dot`, `Callout`, `Gauge`, `Meter` take a `tone` and render an icon or label alongside the colour.
- `CapBar` and `SegmentedProgress` carry a legend; `Swatch` labels colours.
- A verified colour-blind-safe theme (Okabe-Ito) is available through `ThemePicker`.

## Check

Switch to the colour-blind-safe theme or apply a greyscale filter to a screenshot. Every state that was visible before must still be identifiable.
