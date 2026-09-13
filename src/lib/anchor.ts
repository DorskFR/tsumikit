/**
 * `data-*` attributes for addressing a component later — tour anchors, test ids.
 *
 * Components rendering their own element take a full `HTMLAttributes` rest
 * instead; this narrower bag is for those that forward into another component,
 * where a full attribute type collides with the child's narrower props.
 */
export type AnchorAttributes = {
	[key: `data-${string}`]: string | number | boolean | null | undefined;
};
