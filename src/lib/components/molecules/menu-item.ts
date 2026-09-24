export interface MenuItemGlyphs {
	leading: 'icon' | 'check' | 'none';
	trailingCheck: boolean;
}

export interface MenuItemShape {
	icon?: string;
	pressed?: boolean;
	keepOpen?: boolean;
}

export function menuItemGlyphs(item: MenuItemShape): MenuItemGlyphs {
	const checkable = item.pressed !== undefined;
	if (item.icon) return { leading: 'icon', trailingCheck: checkable };
	return { leading: checkable ? 'check' : 'none', trailingCheck: false };
}

export function menuItemCloses(item: MenuItemShape, closeOnSelect: boolean): boolean {
	return item.keepOpen === undefined ? closeOnSelect : !item.keepOpen;
}
