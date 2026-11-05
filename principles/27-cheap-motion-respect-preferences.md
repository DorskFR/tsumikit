# Cheap motion, respected preferences

Animate only transform and opacity, keep durations short, and honour reduced-motion, zoom and paste.

## Why

Vercel and Rauno Freiberg interface guidelines: transform and opacity run on the compositor; animating layout properties janks. `transition: all` animates things you did not intend. Users who set reduced motion, zoom text or paste passwords are telling you something; blocking them is hostile.
Sources: https://vercel.com/design/guidelines , https://interfaces.rauno.me/ , https://www.w3.org/WAI/WCAG22/quickref/

## Do

- Transition `transform` and `opacity`; keep enter around 180 ms and exit shorter.
- Wrap decorative motion in `prefers-reduced-motion: no-preference`, or reduce to a fade.
- Allow pinch and text zoom; never set `user-scalable=no`.
- Allow paste in every input, including password and code fields.

## Don't

- Write `transition: all`.
- Animate `height`, `width`, `top` or `margin`.
- Run looping animations the user cannot stop.
- Disable autocomplete or paste "for security".

## In tsumikit

- Duration tokens `--dur-fast`, `--dur-base`, `--dur-slow`, `--dur-exit`; easing `--ease-out`, `--ease-spring`; press and shift scales `--press-scale`, `--shift-sm`.
- The reset collapses motion under `prefers-reduced-motion: reduce`; `MotionSettings` lets users choose in-app.
- Lint rule `motion` flags `transition: all` and layout-property animations.

## Check

Enable "reduce motion" in the OS and reload: nothing should move except opacity. Record a performance profile while opening a menu: no layout thrash. Zoom to 200%: everything still usable.
