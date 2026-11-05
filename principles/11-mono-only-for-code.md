# Monospace only for code

Use a monospace face only for things that are literally code-like: paths, hashes, identifiers, commands.

## Why

Practical Typography: monospace is slower to read and takes more width per character. Set as prose or labels it makes an interface feel like a terminal and wastes space; set on genuine code it signals "copy this exactly".
Source: https://practicaltypography.com/summary-of-key-rules.html

## Do

- Mono for file paths, commit hashes, IDs, shell commands and code blocks.
- Sans for labels, nav, buttons, descriptions, timestamps and numbers in running text.
- Tabular numerals (`font-variant-numeric: tabular-nums`) in tables and stats so columns line up without going mono.

## Don't

- Set a whole sidebar or label system in mono.
- Use mono for numbers only to align them.
- Mix two mono faces.

## In tsumikit

- `--font-mono` is only applied in code slots; `--font-numeric` and `--font-label` default to sans and can be switched to mono per app.
- `Text` `variant="code"`, `CodeBlock`, `Kbd`, `WorkingDir`, `GitRef` are the mono components.
- `Prose` and `renderMarkdown()` set inline code in mono and prose in sans.

## Check

Select all monospace text on the screen. For each run ask: would a user copy this character by character? If not, it should be sans.
