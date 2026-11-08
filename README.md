# @dorsk/tsumikit

Svelte 5 UI components styled with plain CSS variables: 31 themes, WCAG AA contrast, no runtime dependencies.

[![npm](https://img.shields.io/npm/v/@dorsk/tsumikit)](https://www.npmjs.com/package/@dorsk/tsumikit)
[![CI](https://github.com/DorskFR/tsumikit/actions/workflows/ci.yml/badge.svg)](https://github.com/DorskFR/tsumikit/actions/workflows/ci.yml)
[![svelte](https://img.shields.io/npm/dependency-version/@dorsk/tsumikit/peer/svelte)](https://svelte.dev)
[![license](https://img.shields.io/npm/l/@dorsk/tsumikit)](LICENSE)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/hero-dark.png">
  <img alt="tsumikit showcase page: breadcrumb, page header with actions, four metric cards, a settings form with inputs, selects, checkboxes, switches, slider, radio group and segmented control, and a panel of button variants, sizes, tones, split buttons and a menu" src="docs/assets/hero-light.png" width="900">
</picture>

Every colour, space, radius and size is a CSS custom property: a theme is one block of variables, a component is restyled with `style="--btn-bg: …"`. Interactive parts use `<dialog>`, the Popover API and native form controls; a design lint and [design principles](principles/README.md) ship in the package.

[Live demo with every component and prop](https://dorskfr.github.io/tsumikit)

## Install

```sh
npm i @dorsk/tsumikit
```

Peer: `svelte@^5.0.0`. Inter font bundled.

## Quick start

```svelte
<script lang="ts">
  import '@dorsk/tsumikit/styles/app.css';
  import { Button, Field, Input, Toaster, toasts } from '@dorsk/tsumikit';

  let name = $state('');
</script>

<Field label="Workspace name" for="name">
  <Input id="name" bind:value={name} />
</Field>
<Button variant="primary" onclick={() => toasts.ok(`Saved ${name}`)}>Save</Button>
<Toaster />
```

Import the stylesheet once at the app root. Pressing Save shows an `ok` toast.

### Start a new project

Copy [`examples/starter`](examples/starter) and replace `"file:../.."` with a version. Contents: [examples/starter/README.md](examples/starter/README.md).

Upgrading from 0.81 or older: [docs/MIGRATION-0.82.md](docs/MIGRATION-0.82.md).

## Theming

31 themes, all tested for WCAG AA contrast. `<ThemePicker />` persists the choice in `localStorage`; `auto` follows `prefers-color-scheme`.

```ts
import { theme } from '@dorsk/tsumikit';
theme.register({ id: 'acme', label: 'Acme', mode: 'dark' });
theme.setDefault('acme');
```

```css
/* brand.css, imported after the kit stylesheet */
[data-theme='acme'] {
  --c-bg: #2a2a2a;
  --c-accent: #5ac8c8;
  /* …the rest of the 19 --c-* palette tokens, shadows and --mach-* pairs */
}
```

```svelte
<Button style="--btn-bg: var(--c-violet); --btn-fg: #fff; --btn-radius: 0">Ship</Button>
```

Theme contract, looks, stylesheets and typeface: [docs/theming.md](docs/theming.md). Per-component custom properties and test ids: [docs/styling.md](docs/styling.md).

## Components

Layers: `tokens.css`, atoms (the only raw `<button>`/`<input>`/`<select>`), molecules, layouts. Each reaches one layer down ([docs/design.md](docs/design.md)). Props, `aria-*` included, spread onto the underlying element.

| Layer | Components |
|---|---|
| [Atoms](docs/components.md#atoms) | Text, Heading, Button, Input, Textarea, Select, Switch, Checkbox, Slider, Gauge, Avatar, Card, Badge, Link, Icon |
| [Molecules](docs/components.md#molecules) | Field, Modal, Popover, Menu, Tabs, Combobox, Disclosure, Accordion, Toaster, ThemePicker, Drawer, SplitButton, SortableList |
| [Organisms](docs/components.md#organisms) | DataTable, ConversationPanel, ConversationFeed, FilterSearchBar |
| [Layouts](docs/components.md#layouts) | AppShell, NavBar, MasterDetail, Container, Stack, Cluster, AutoGrid |
| [Mobile and media](docs/components.md#mobile-tabbar-swiperow-pulltorefresh) | TabBar, SwipeRow, PullToRefresh, SeekSlider, VolumeSlider |
| [Stores and helpers](docs/components.md#stores-actions-and-helpers) | `theme`, `toasts`, `fontScale`, `autoresize`, `copyToClipboard` |

| Guide | Covers |
|---|---|
| [Patterns](docs/patterns.md) | loading, undo over confirm, URL state, breakpoints |
| [Layout and sizing](docs/layout.md) | container queries, rem sizing, control heights, 44px hit areas |
| [Guardrails](docs/guardrails.md) | `tsumikit-lint` CLI, dev-mode warnings |
| [Sound](docs/sound.md) | opt-in UI sounds |
| [Accessibility](docs/accessibility.md) | ARIA patterns, platform features |
| [Design principles](principles/README.md) | 30 principles, each with a check |

## Limitations

- Svelte 5 only.
- No bundled syntax highlighter: `CodeBlock` takes a `highlight` callback ([details](docs/components.md#syntax-highlighting-codeblock)).
- Internal class names (`.btn`) and `data-tsu` markers are private and may change in any release. Style through the published custom properties, not `:global()`.
- Pre-1.0: minor releases can change defaults. Migration notes are in [`docs/`](docs/).

## Development

```sh
git clone https://github.com/DorskFR/tsumikit && cd tsumikit
npm install
npm run dev          # showcase at the printed URL (+ /shell for the AppShell demo)
npm test             # contract tests (node --test)
npm run lint         # biome
npm run check        # svelte-check
npm run build        # prerendered static site in /build
npm run package      # publishable library in /dist (+ publint)
```

Hooks (lefthook, via `prepare`): Biome on commit, `svelte-check` on push. A `v*` tag publishes to npm through GitHub Actions trusted publishing.

## License

[MIT](LICENSE)
