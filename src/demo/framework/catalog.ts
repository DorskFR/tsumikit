import { kebab } from './snippet';

export const FAMILIES = ['foundations', 'atoms', 'molecules', 'organisms', 'layouts'] as const;
export type Family = (typeof FAMILIES)[number];

export const FAMILY_LABEL: Record<Family, string> = {
	foundations: 'Foundations',
	atoms: 'Atoms',
	molecules: 'Molecules',
	organisms: 'Organisms',
	layouts: 'Layouts',
};

/**
 * Every component (and foundation topic) the showcase must cover, with the
 * legacy section it lived in. A directory under `src/demo/<family>/<Name>/`
 * replaces the stub; this list only feeds stubs and legacy redirects until the
 * cutover removes it.
 */
export const CATALOG: Record<Family, Record<string, string | null>> = {
	foundations: {
		Typography: 'typography',
		ThemeTokens: 'theme-tokens',
		Theming: 'theme-tokens',
		TextScaling: 'text-scaling',
		StyleHooks: 'style-hooks',
	},
	atoms: {
		Artwork: 'nav-item',
		Avatar: 'avatar',
		Badge: 'badge',
		Button: 'button',
		Card: 'card',
		Checkbox: 'checkbox-radio',
		Divider: 'divider',
		Dot: 'badge',
		Gauge: 'gauge',
		Heading: 'typography',
		Icon: 'icon',
		Input: 'form-atoms',
		Kbd: 'form-atoms',
		Link: 'badge',
		Progress: 'progress',
		Scrim: null,
		SegmentedProgress: 'progress',
		Select: 'form-atoms',
		Skeleton: 'empty-state',
		Slider: 'form-atoms',
		Spinner: 'icon',
		Swatch: 'swatch',
		Switch: 'form-atoms',
		Text: 'typography',
		Textarea: 'form-atoms',
		TimeDisplay: 'player-sliders',
	},
	molecules: {
		Accordion: 'accordion',
		AttachmentList: 'attachment-list',
		Breadcrumb: 'breadcrumb',
		Callout: 'callout',
		CapBar: 'cap-bar',
		Carousel: 'carousel',
		ChatBubble: 'conversation',
		CodeBlock: 'code-block',
		Combobox: 'combobox',
		Composer: 'conversation',
		ConfirmModal: 'confirm-modal',
		CopyButton: 'button',
		Disclosure: 'accordion',
		Drawer: 'drawer',
		Dropzone: 'file-dropzone',
		EmojiPicker: 'emoji-picker',
		EmptyState: 'empty-state',
		Field: 'form-atoms',
		Fieldset: 'fieldset',
		FileButton: 'file-dropzone',
		FilterInput: 'filter-search-bar',
		FontScalePicker: 'text-scaling',
		GitRef: 'git-ref',
		GlyphStack: 'glyph-stack',
		IconButton: 'icon',
		InputGroup: 'input-group',
		KeyValue: 'section-header',
		LoadMore: 'section-header',
		Menu: 'popover-menu',
		Meter: null,
		Metric: 'metric',
		Modal: 'modal',
		OptionButton: 'toggle',
		Pagination: 'pagination',
		Popover: 'popover-menu',
		Prose: 'conversation',
		PullToRefresh: 'pull-to-refresh',
		RadialMenu: 'radial-menu',
		RadioGroup: 'checkbox-radio',
		SectionHeader: 'section-header',
		SeekSlider: 'player-sliders',
		SegmentedControl: 'segmented-control',
		SelectButton: 'toggle',
		SortableList: 'sortable-list',
		SplitButton: 'split-button',
		StatusBar: 'conversation',
		SwipeRow: 'swipe-row',
		Tabs: 'tabs',
		ThemePicker: 'theme-tokens',
		Timestamp: 'timestamp',
		Toaster: 'toasts',
		Toggle: 'toggle',
		Tooltip: 'tooltip',
		Truncate: 'truncate',
		VolumeSlider: 'player-sliders',
		WorkingDir: 'working-dir',
	},
	organisms: {
		ConversationFeed: 'conversation',
		ConversationPanel: 'conversation',
		DataTable: 'data-table',
		FilterSearchBar: 'filter-search-bar',
	},
	layouts: {
		AppShell: null,
		AutoGrid: 'layout-primitives',
		Cluster: 'layout-primitives',
		Container: null,
		MasterDetail: 'master-detail',
		NavBar: 'navbar',
		NavItem: 'nav-item',
		NavSection: null,
		ResizablePanel: 'working-dir',
		Stack: 'layout-primitives',
		TabBar: 'tab-bar',
		Toolbar: null,
	},
};

/** Components that only exist on the `/shell` route today. */
export const SHELL_ONLY = new Set(['AppShell', 'Container', 'NavSection']);

export function catalogId(name: string): string {
	return kebab(name);
}
