# Labels are a last resort

Show a label only when the value cannot explain itself; when you do, make it small and quiet so the value carries the weight.

## Why

Refactoring UI: "Year: 2023" makes the eye scan words, "2023" alone reads as a fact. Labels at the same weight as values double the text and halve the information density.
Source: https://www.refactoringui.com/

## Do

- Drop labels where the format is self-evident: years, file sizes, durations, email addresses.
- Fold the label into the value where it reads naturally ("3 files", "Korean audio").
- When a label stays, set it small, muted, often uppercase and tracked, with the value in full contrast.
- Lay out label and value pairs as a strip or grid that reads in one glance.

## Don't

- Write "Label: value" lists in the same weight and colour.
- Separate related facts with " · " in a single run of text where a strip would scan faster.

## In tsumikit

- `KeyValue` renders muted label and strong value; `Metric` and `StatTile` for numeric facts.
- `Text` `variant="eyebrow"` for small uppercase labels; `tone="muted"` for the label colour `--text-muted`.
- `--font-label` and `--font-numeric` (default to sans; opt into mono for data-dense views).

## Check

Read each label on the screen and ask whether the value would be ambiguous without it. Remove the ones that would not. Remaining labels must be visibly quieter than their values.
