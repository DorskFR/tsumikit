// Toast manager. A tiny reactive queue; mount one <Toaster /> at the app root
// and call toasts.show()/ok()/error() from anywhere. Auto-dismisses after
// `duration` ms (0 = sticky). The Toaster renders an aria-live region so screen
// readers announce messages.

export type ToastTone = 'neutral' | 'ok' | 'error';

export interface Toast {
	id: number;
	message: string;
	tone: ToastTone;
	duration: number;
}

let seq = 0;

class Toasts {
	items = $state<Toast[]>([]);

	show(message: string, opts: { tone?: ToastTone; duration?: number } = {}): number {
		const id = ++seq;
		const duration = opts.duration ?? 4000;
		this.items = [...this.items, { id, message, tone: opts.tone ?? 'neutral', duration }];
		if (duration > 0) setTimeout(() => this.dismiss(id), duration);
		return id;
	}
	ok(message: string, duration?: number) {
		return this.show(message, { tone: 'ok', duration });
	}
	error(message: string, duration?: number) {
		return this.show(message, { tone: 'error', duration });
	}
	dismiss(id: number) {
		this.items = this.items.filter((t) => t.id !== id);
	}
}

export const toasts = new Toasts();
