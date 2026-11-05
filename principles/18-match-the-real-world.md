# Speak the user's language

Words, icons and order follow the user's world, not the system's internals.

## Why

Nielsen heuristic 2: match between the system and the real world. Users should not have to translate "entity", "node" or "sync job" into the things they actually own. Natural ordering (recent first, alphabetical) and familiar formats (relative time, local units) reduce effort.
Source: https://www.nngroup.com/articles/ten-usability-heuristics/

## Do

- Name things what users call them (a "film", not a "media item"; "folder", not "root path").
- Format dates and durations the way people say them ("2 hours ago", "1 h 42 min").
- Order lists the way users scan them, and say what the order is.
- Use icons whose meaning is already established; add a label where it is not.

## Don't

- Expose database field names, enum values or internal IDs as labels.
- Show ISO timestamps where a relative time would do.
- Invent a new icon for a familiar action.

## In tsumikit

- `Timestamp`, `relativeTime()` and `formatTimestamp()` for human time; `TimeDisplay`, `formatMediaTime()` for durations.
- `formatCount()` for counts with sensible rounding; `Truncate` keeps long paths readable.
- `Icon` ships a conventional icon set; `Tooltip` adds a label where meaning is not obvious.

## Check

Read every label and message aloud as if to a friend who does not know the codebase. Any word you would have to explain is a label to change.
