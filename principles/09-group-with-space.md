# Group with space, not boxes

Related items sit closer together or on a shared background; unrelated items are separated by more space, not by borders.

## Why

Gestalt laws of proximity and common region: things close together, or inside one region, are read as a group. Space between groups must be clearly larger than space within them, or the grouping disappears.
Sources: https://lawsofux.com/law-of-proximity/ , https://lawsofux.com/law-of-common-region/

## Do

- Within a group: one small step (4 or 8). Between groups: at least two steps larger (24 or 32).
- Use a shared background tint to group without a border.
- Put a label or heading closer to the content it describes than to the content above it.

## Don't

- Space twelve items evenly and expect the reader to find the four groups.
- Draw a border around each group when a gap would do.
- Let a section heading float equidistant between two sections.

## In tsumikit

- `Stack` with a per-group gap and a larger gap between stacks; `Cluster` for inline groups.
- `Card` and `Fieldset` for common region; `Divider` only when space cannot separate.
- `SectionHeader` attaches a heading to the block that follows.
- Spacing tokens `--sp-2`, `--sp-6`, `--sp-8` give the within / between contrast.

## Check

Blur a screenshot until text is unreadable. The groups you intended must still be visible as clusters. If you see one even grid, the gaps are too uniform.
