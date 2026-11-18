import type { ComponentMeta } from '../../framework/registry';

export const meta: ComponentMeta = {
	description:
		'Bottom-centred toast stack fed by the toasts store: four tones, timed or sticky, an optional async action, undo with optimistic apply, pause on hover, swipe sideways on touch to dismiss, moves into an open modal.',
	keywords: [
		'toast',
		'notification',
		'snackbar',
		'undo',
		'optimistic',
		'status',
		'live region',
		'store',
		'swipe',
	],
	seeAlso: ['Callout', 'Modal', 'StatusBar'],
};
