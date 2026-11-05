# Prevent errors before reporting them

Design so the mistake cannot happen: constrain input, show consequences before commit, and make the safe path the default.

## Why

Nielsen heuristic 5: a careful design that prevents a problem is better than a good error message. Slips (wrong button) and mistakes (wrong mental model) have different cures: constraints and defaults for slips, previews and plain language for mistakes.
Source: https://www.nngroup.com/articles/ten-usability-heuristics/

## Do

- Use the control that only allows valid values: a select, a slider, a date picker, a segmented choice.
- Validate as the user leaves a field, not after they submit the form.
- Separate destructive actions from frequent ones in space and style.
- Default to the safe choice; show the effect of a setting next to it.

## Don't

- Accept free text where the set of valid answers is known.
- Place "Delete" next to "Save" in the same style.
- Validate everything only on submit and then scroll the user to the top.

## In tsumikit

- `Select`, `RichSelect`, `Combobox`, `Slider`, `SegmentedControl`, `RadioGroup`, `Switch` constrain input.
- `Field` attaches help text and inline validation; `Fieldset` groups related choices.
- `Button` `variant="danger"` plus distance in a `Toolbar` keeps destructive actions apart; `ConfirmModal` for the truly irreversible.

## Check

For each input on the screen, try to enter something invalid. The control should refuse or flag it before submit. For each destructive action, check it cannot be hit by a slip from a neighbouring frequent action.
