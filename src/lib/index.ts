// @dorsk/uikit — public API.
//
// Styles are NOT auto-imported (so consumers control bundling). Import once at
// your app root:
//   import '@dorsk/uikit/styles/app.css';
// then use the components below.

// ---- atoms ----
export { default as Text } from './components/atoms/Text.svelte';
export { default as Heading } from './components/atoms/Heading.svelte';
export { default as Button } from './components/atoms/Button.svelte';
export { default as Input } from './components/atoms/Input.svelte';
export { default as Textarea } from './components/atoms/Textarea.svelte';
export { default as Select } from './components/atoms/Select.svelte';
export { default as Switch } from './components/atoms/Switch.svelte';
export { default as Card } from './components/atoms/Card.svelte';
export { default as Badge } from './components/atoms/Badge.svelte';
export { default as Chip } from './components/atoms/Chip.svelte';
export { default as Link } from './components/atoms/Link.svelte';
export { default as Checkbox } from './components/atoms/Checkbox.svelte';
export { default as Slider } from './components/atoms/Slider.svelte';
export { default as Progress } from './components/atoms/Progress.svelte';
export { default as Icon } from './components/atoms/Icon.svelte';
export type { IconName } from './components/atoms/Icon.svelte';

// ---- molecules ----
export { default as Field } from './components/molecules/Field.svelte';
export { default as IconButton } from './components/molecules/IconButton.svelte';
export { default as SelectButton } from './components/molecules/SelectButton.svelte';
export { default as Toggle } from './components/molecules/Toggle.svelte';
export { default as OptionButton } from './components/molecules/OptionButton.svelte';
export { default as Modal } from './components/molecules/Modal.svelte';
export { default as Tooltip } from './components/molecules/Tooltip.svelte';
export {
	default as Accordion,
	type AccordionItem
} from './components/molecules/Accordion.svelte';
export { default as Popover } from './components/molecules/Popover.svelte';
export { default as Menu, type MenuItem } from './components/molecules/Menu.svelte';
export { default as Tabs, type TabItem } from './components/molecules/Tabs.svelte';
export {
	default as RadioGroup,
	type RadioOption
} from './components/molecules/RadioGroup.svelte';
export { default as CopyButton } from './components/molecules/CopyButton.svelte';
export { default as FileButton } from './components/molecules/FileButton.svelte';
export { default as Dropzone } from './components/molecules/Dropzone.svelte';
export { default as Toaster } from './components/molecules/Toaster.svelte';
export { toasts, type Toast, type ToastTone } from './stores/toast.svelte';
export { default as ThemePicker } from './components/molecules/ThemePicker.svelte';
export { default as FontScalePicker } from './components/molecules/FontScalePicker.svelte';

// ---- organisms ----
export { default as DataTable, type Column } from './components/organisms/DataTable.svelte';

// ---- layouts ----
export { default as AppShell } from './components/layouts/AppShell.svelte';
export { default as Container } from './components/layouts/Container.svelte';
export { default as NavItem } from './components/layouts/NavItem.svelte';

// ---- stores / actions ----
export { theme, THEMES, type Mode } from './stores/theme.svelte';
export { fontScale, SCALE_LEVELS, type ScaleLevel } from './stores/fontscale.svelte';
export { autoresize } from './autoresize';
