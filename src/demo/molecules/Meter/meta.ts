import type { ComponentMeta } from '../../framework/registry';

export const meta: ComponentMeta = {
	description:
		'A labelled, read-only level with its readout: a quota, disk or budget bar with markers, warn and danger thresholds, a caption and trailing actions. Progress is the bare bar; Gauge is the tiny inline dial; CapBar adds a draggable cap.',
	keywords: ['quota', 'usage', 'level', 'budget', 'disk', 'storage', 'threshold', 'bar', 'readout'],
	seeAlso: ['Progress', 'Gauge', 'CapBar', 'Metric'],
};
