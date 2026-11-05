# Recognition over recall

Show options, state and context on screen instead of making people remember them.

## Why

Nielsen heuristic 6 and Miller's law: working memory is small. Visible choices, remembered recent inputs and persistent context (where am I, what is selected) reduce the load; anything a user must remember from a previous screen is a defect.
Sources: https://www.nngroup.com/articles/ten-usability-heuristics/ , https://lawsofux.com/millers-law/

## Do

- Show where the user is: breadcrumbs, active nav, page title.
- Offer suggestions and recent values in inputs instead of requiring exact syntax.
- Keep the selection visible while acting on it (toolbar shows "3 selected").
- Reveal keyboard shortcuts next to the actions they trigger.

## Don't

- Require typed identifiers the user saw on another page.
- Hide the current filter behind a closed panel with no summary.
- Show a modal that covers the data it asks about.

## In tsumikit

- `Breadcrumb`, `NavBar`, `TabBar` and `Tabs` show current location; `SectionHeader` names the block.
- `Combobox`, `FilterInput` and `suggest()` surface valid values while typing.
- `Kbd` and `Tooltip` show shortcuts in place; `Popover` and `Drawer` reveal detail without hiding context.

## Check

Open any page cold. Can you tell where you are, what is selected and what filters apply without clicking anything? Then try each input without reading docs: valid values must be discoverable from the control itself.
