# tsumikit starter

The copy-paste baseline for a new app on `@dorsk/tsumikit`:

- `src/routes/+layout.svelte`: the kit stylesheet (tokens, themes, Inter), `AppShell` with a sidebar, `ThemePicker`, `Toaster`.
- `src/routes/+error.svelte`: every error, 404 included, is an `EmptyState tone="danger"` in plain words with a way out.
- `src/routes/items`: a list with a URL-driven filter (`Tabs href` + `urlState`), `LoadMore`, empty and filtered-empty states, and delete with `toasts.undo()` instead of a confirm dialog.
- `lefthook.yml` and `npm run lint`: `tsumikit-lint` on every commit.

```sh
npm install
npm run dev
npm run lint
npm run build
```

To start your own project, copy this directory and change the dependency to a version:

```json
"@dorsk/tsumikit": "^0.82.0"
```

The design rules the kit enforces are in `node_modules/@dorsk/tsumikit/principles/` and on the showcase's `/principles` page.
