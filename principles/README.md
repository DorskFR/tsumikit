# Design principles

The principles tsumikit is built to serve, one file each. They distil Nielsen's usability heuristics, Laws of UX, Refactoring UI, Practical Typography, the Vercel and Rauno Freiberg web interface guidelines, WCAG 2.2 and Dieter Rams. Each file states the principle in one line, why it holds (with the source), do and don't lists, what the kit provides for it, and a check you can run on a screen.

They ship in the package: `node_modules/@dorsk/tsumikit/principles/`. Point a design review, or a coding agent, at them.

## Index

| # | Principle | In one line |
|---|---|---|
| 01 | [Visibility of system status](01-visibility-of-status.md) | Acknowledge every action within 100 ms and state the outcome. |
| 02 | [One primary action per view](02-one-primary-action.md) | One filled button; the rest outlined, plain or behind a menu. |
| 03 | [Emphasise by de-emphasising](03-emphasise-by-de-emphasising.md) | Quiet the surroundings instead of enlarging the subject; three text levels. |
| 04 | [Labels are a last resort](04-labels-last-resort.md) | Drop labels the value makes obvious; keep the rest small and muted. |
| 05 | [Tint your greys](05-tint-the-greys.md) | Every grey shares a slight hue; no neutral hexes. |
| 06 | [Depth from shade, not outlines](06-depth-from-shade.md) | Layers differ by background lightness; borders are faint or absent. |
| 07 | [One accent, used sparingly](07-one-accent.md) | Accent marks primary, active and focus; status colours mean status. |
| 08 | [A spacing scale, room to breathe](08-spacing-scale.md) | All spacing from the scale; start airy, then remove. |
| 09 | [Group with space, not boxes](09-group-with-space.md) | Proximity and shared background group; gaps between groups are larger. |
| 10 | [A real typeface, a fixed scale](10-real-typeface-fixed-scale.md) | Bundle a screen typeface; fixed type scale, few weights. |
| 11 | [Monospace only for code](11-mono-only-for-code.md) | Mono for paths, hashes, commands; sans for everything else. |
| 12 | [Keep lines 45 to 75 characters](12-measure.md) | Cap reading width independent of the viewport. |
| 13 | [Imagery sets the mood](13-imagery-sets-the-mood.md) | Backdrops with a fade, text on a scrim, designed placeholders. |
| 14 | [Feedback is instant and calm](14-instant-calm-feedback.md) | Spinner after 200 ms, kept 500 ms; optimistic updates with rollback. |
| 15 | [Prefer undo over confirmation](15-undo-over-confirm.md) | Reversible actions with undo; confirm only the irreversible. |
| 16 | [Empty states are design too](16-empty-states.md) | Say what belongs here and offer the action that fills it. |
| 17 | [Errors in plain words](17-errors-in-plain-words.md) | What happened, why, and what to do next. |
| 18 | [Speak the user's language](18-match-the-real-world.md) | Names, formats and order from the user's world, not the system's. |
| 19 | [Consistency beats local cleverness](19-consistency-and-standards.md) | Same thing, same look and behaviour, everywhere; follow conventions. |
| 20 | [Prevent errors](20-error-prevention.md) | Constrain input, validate early, keep destructive actions apart. |
| 21 | [Recognition over recall](21-recognition-over-recall.md) | Show location, selection, options and shortcuts on screen. |
| 22 | [Shortcuts for the experienced](22-flexibility-and-shortcuts.md) | Keyboard, bulk and saved views layered on a simple default. |
| 23 | [The URL is state](23-url-is-state.md) | Filters, tabs, sort and page survive refresh, Back and sharing. |
| 24 | [Links are links](24-links-are-links.md) | Anchors navigate, buttons act; middle-click always works. |
| 25 | [Visible focus](25-visible-focus.md) | Every control shows a focus ring under `:focus-visible`. |
| 26 | [Generous targets](26-generous-targets.md) | 24px with a pointer, 44px on touch, no dead zones. |
| 27 | [Cheap motion, respected preferences](27-cheap-motion-respect-preferences.md) | Transform and opacity only; honour reduced motion, zoom, paste. |
| 28 | [Less, but better](28-less-but-better.md) | Every element earns its place or goes. |
| 29 | [Colour is never the only cue](29-colour-is-not-the-only-cue.md) | Pair every status colour with an icon, label or shape. |
| 30 | [Help where it is needed](30-help-where-needed.md) | One line of help beside the thing it explains. |

## Designing a screen: the checklist

Run through this before calling a screen done. Each line points at the principle with the full check.

1. The first viewport answers "what is this, what state is it in, what can I do". (28, 21)
2. Exactly one filled button; no action bar wraps at 40rem. (02)
3. Three text levels at most; muted text passes 4.5:1. (03)
4. Every label left on screen is one the value could not do without. (04)
5. All greys tinted, layers told apart by shade, borders faint. (05, 06)
6. Accent only on primary, active, focus, selection; status colours paired with a cue. (07, 29)
7. Every gap and padding is a scale step; gaps between groups are larger than within. (08, 09)
8. Bundled typeface, scale sizes only, mono only for code-like text, lines 45 to 75 characters. (10, 11, 12)
9. Images fade into the page, text over them sits on a scrim, missing images get a placeholder. (13)
10. Every click changes something within 100 ms; spinners appear after 200 ms and stay 500 ms. (01, 14)
11. Destructive actions have undo, or a confirm that names the loss. (15, 20)
12. Empty, filtered-empty and failed states each have copy and an action; errors say what to do next. (16, 17)
13. Labels and messages read like a person talking; the same thing is named the same everywhere. (18, 19)
14. Filters, tabs, sort and page are in the URL; navigation is real anchors. (23, 24)
15. Tab through the screen: focus is visible everywhere; targets are 24px / 44px. (25, 26)
16. No `transition: all`; reduced motion, zoom and paste all respected. (27)
17. Help text sits beside the thing it explains; shortcuts are visible. (30, 22)
