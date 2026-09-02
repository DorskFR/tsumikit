// Toast manager. A tiny reactive queue; mount one <Toaster /> at the app root
// and call toasts.show()/ok()/error()/info() from anywhere. Auto-dismisses after
// `duration` ms (0 = sticky). The Toaster renders an aria-live region so screen
// readers announce messages.

export type ToastTone = 'neutral' | 'ok' | 'error' | 'info';
/** Accepted by show(); 'danger' is normalised to 'error'. */
export type ToastToneInput = ToastTone | 'danger';

export interface ToastAction {
	label: string;
	run: () => void | Promise<void>;
}

export interface Toast {
	id: number;
	message: string;
	tone: ToastTone;
	duration: number;
	action?: ToastAction;
	/** True while `action.run` is in flight; the Toaster shows the button loading. */
	pending: boolean;
}

export interface ToastOptions {
	tone?: ToastToneInput;
	duration?: number;
	action?: ToastAction;
}

export const TOAST_MS = 4000;
/** Toasts with an action linger longer: the action is only reachable while visible. */
export const ACTION_TOAST_MS = 7000;

let seq = 0;

class Toasts {
	items = $state<Toast[]>([]);
	#timers = new Map<number, ReturnType<typeof setTimeout>>();

	show(message: string, opts: ToastOptions = {}): number {
		const id = ++seq;
		const duration = opts.duration ?? (opts.action ? ACTION_TOAST_MS : TOAST_MS);
		const tone: ToastTone = opts.tone === 'danger' ? 'error' : (opts.tone ?? 'neutral');
		this.items = [
			...this.items,
			{ id, message, tone, duration, action: opts.action, pending: false },
		];
		if (duration > 0)
			this.#timers.set(
				id,
				setTimeout(() => this.dismiss(id), duration),
			);
		return id;
	}
	ok(message: string, duration?: number, action?: ToastAction) {
		return this.show(message, { tone: 'ok', duration, action });
	}
	error(message: string, duration?: number, action?: ToastAction) {
		return this.show(message, { tone: 'error', duration, action });
	}
	info(message: string, duration?: number, action?: ToastAction) {
		return this.show(message, { tone: 'info', duration, action });
	}
	dismiss(id: number) {
		const timer = this.#timers.get(id);
		if (timer) clearTimeout(timer);
		this.#timers.delete(id);
		this.items = this.items.filter((t) => t.id !== id);
	}
	/** Run a toast's action once: the toast stays (button loading) until run settles, then dismisses. */
	async act(id: number) {
		const t = this.items.find((x) => x.id === id);
		if (!t?.action || t.pending) return;
		const timer = this.#timers.get(id);
		if (timer) clearTimeout(timer);
		this.items = this.items.map((x) => (x.id === id ? { ...x, pending: true } : x));
		try {
			await t.action.run();
		} catch (e) {
			this.error(e instanceof Error ? e.message : String(e));
		} finally {
			this.dismiss(id);
		}
	}
}

export const toasts = new Toasts();
