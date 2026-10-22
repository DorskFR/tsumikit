export const FAMILIES = ['foundations', 'atoms', 'molecules', 'organisms', 'layouts'] as const;
export type Family = (typeof FAMILIES)[number];

export const FAMILY_LABEL: Record<Family, string> = {
	foundations: 'Foundations',
	atoms: 'Atoms',
	molecules: 'Molecules',
	organisms: 'Organisms',
	layouts: 'Layouts',
};
