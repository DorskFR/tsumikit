# Design

[Back to the README](../README.md)

## Layers

Each layer reaches only one layer down:

```
variables.css  →  every color/space/radius/font/size is a var(--…). No
                  component hard-codes a hex or a pixel.
      ↓
atoms          →  the only place raw <button>/<input>/<select>/<h*>/text lives.
      ↓
molecules      →  compose or specialize atoms (never reimplement a primitive).
      ↓
your app       →  assemble molecules + layout.
```

**Rules:** primitives live in atoms only · specialize, don't reimplement · no
hard-coded values · override by specificity, never by forking · props (incl.
`aria-*`) spread down onto the underlying element.

## Principles

The design principles the kit serves, one markdown file each, live in
[`principles/`](../principles/README.md) and ship in the package
(`node_modules/@dorsk/tsumikit/principles/`). Each gives the principle, its
source, do / don't, what tsumikit provides for it, and a check to run on a
screen. The index ends with a short checklist for designing a screen; point
design reviews and coding agents at it. The showcase renders them at
[`/principles`](https://dorskfr.github.io/tsumikit/principles).
