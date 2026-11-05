# Let imagery set the mood, keep the chrome quiet

Content imagery carries atmosphere; UI chrome stays neutral, text over images sits on a scrim, and a missing image gets a designed placeholder.

## Why

Aesthetic-usability effect: interfaces perceived as beautiful are perceived as easier to use and are forgiven more. A backdrop fading into the page does more than any amount of styled chrome. An empty grey box where an image should be breaks the spell instantly.
Sources: https://lawsofux.com/aesthetic-usability-effect/ , https://www.refactoringui.com/

## Do

- Lead detail pages with a backdrop or hero image that fades into the page background.
- Place text over images only on a gradient scrim that guarantees contrast.
- Generate a placeholder from the item itself (initials, a hue derived from its name) when the image is missing or still loading.
- Give every meaningful image alt text; decorative images get an empty alt.

## Don't

- Compete with the image using coloured chrome or heavy borders.
- Render white text directly on an unpredictable photo.
- Show an empty or broken-image box, even briefly.

## In tsumikit

- `Backdrop` layout for the hero-with-fade; `Scrim` for readable text over images.
- `Artwork` shows a designed placeholder while loading or missing, via `artworkGradient()`, `artworkHue()` and `initials()`; `Avatar` does the same for people.
- `Skeleton` for placeholders that are shapes rather than pictures.
- Lint rule `img-alt` requires alt text on images.

## Check

Load the page with images blocked. Every image slot must still show an intentional placeholder. Then re-enable images and verify text over them passes 4.5:1 at its lightest point.
