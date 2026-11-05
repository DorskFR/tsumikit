// Toast manager. A tiny reactive queue; mount one <Toaster /> at the app root
// and call toasts.show()/ok()/error()/info() from anywhere. Auto-dismisses after
// `duration` ms (0 = sticky). toasts.undo() is the optimistic alternative to a
// confirm dialog. The Toaster renders an aria-live region so screen readers
// announce messages.

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
	/** Dismissed: the Toaster plays the exit while the store holds it for `TOAST_EXIT_MS`. */
	leaving: boolean;
}

export interface ToastOptions {
	tone?: ToastToneInput;
	duration?: number;
	action?: ToastAction;
}

export interface UndoOptions {
	message: string;
	/** Runs at once: the optimistic UI change. */
	apply: () => void;
	/** Runs when the toast times out or is dismissed; a rejection reverts and reports. */
	commit: () => void | Promise<void>;
	/** Runs on Undo, and after a failed commit. */
	revert: () => void | Promise<void>;
	duration?: number;
	tone?: ToastToneInput;
	undoLabel?: string;
	/** Error toast shown when commit() rejects. */
	failMessage?: string;
}

export const UNDO_FAIL_MESSAGE = 'The change could not be saved, so it was undone.';

export const TOAST_MS = 4000;
/** Toasts with an action linger longer: the action is only reachable while visible. */
export const ACTION_TOAST_MS = 7000;
/** Matches `--dur-exit-slow`; the removal never waits on `transitionend` alone. */
export const TOAST_EXIT_MS = 200;

let seq = 0;

class Toasts {
	items = $state<Toast[]>([]);
	#timers = new Map<number, ReturnType<typeof setTimeout>>();
	#due = new Map<number, number>();
	#paused = new Map<number, number>();
	#commits = new Map<number, () => void>();
	#flushBound = false;

	#arm(id: number, ms: number) {
		this.#due.set(id, Date.now() + ms);
		this.#timers.set(
			id,
			setTimeout(() => this.dismiss(id), ms),
		);
	}
	#disarm(id: number) {
		const timer = this.#timers.get(id);
		if (timer) clearTimeout(timer);
		this.#timers.delete(id);
		this.#due.delete(id);
		this.#paused.delete(id);
	}

	show(message: string, opts: ToastOptions = {}): number {
		const id = ++seq;
		const duration = opts.duration ?? (opts.action ? ACTION_TOAST_MS : TOAST_MS);
		const tone: ToastTone = opts.tone === 'danger' ? 'error' : (opts.tone ?? 'neutral');
		this.items = [
			...this.items,
			{ id, message, tone, duration, action: opts.action, pending: false, leaving: false },
		];
		if (duration > 0) this.#arm(id, duration);
		return id;
	}
	/** Hold the auto-dismiss (pointer over the toast); `resume` restarts the remaining time. */
	pause(id: number) {
		const due = this.#due.get(id);
		if (due === undefined) return;
		const left = Math.max(0, due - Date.now());
		this.#disarm(id);
		this.#paused.set(id, left);
	}
	resume(id: number) {
		const left = this.#paused.get(id);
		this.#paused.delete(id);
		if (left === undefined || !this.items.some((t) => t.id === id && !t.leaving)) return;
		this.#arm(id, left);
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
	/**
	 * Optimistic change with an Undo toast instead of a confirm dialog: apply()
	 * now, commit() when the toast goes away, revert() on Undo or a failed commit.
	 */
	undo(opts: UndoOptions): number {
		const { message, apply, commit, revert, duration = ACTION_TOAST_MS } = opts;
		apply();
		let settled = false;
		const id = this.show(message, {
			tone: opts.tone,
			duration,
			action: {
				label: opts.undoLabel ?? 'Undo',
				run: () => {
					settled = true;
					this.#commits.delete(id);
					return revert();
				},
			},
		});
		this.#commits.set(id, () => {
			if (settled) return;
			settled = true;
			this.#commits.delete(id);
			Promise.resolve()
				.then(commit)
				.catch(async () => {
					try {
						await revert();
					} catch {}
					this.error(opts.failMessage ?? UNDO_FAIL_MESSAGE);
				});
		});
		if (!this.#flushBound && typeof window !== 'undefined') {
			this.#flushBound = true;
			window.addEventListener('pagehide', () => this.flush());
		}
		return id;
	}
	/** Commit every undo toast still waiting; the page is going away. */
	flush() {
		for (const run of [...this.#commits.values()]) run();
	}
	dismiss(id: number) {
		this.#disarm(id);
		this.#commits.get(id)?.();
		const t = this.items.find((x) => x.id === id);
		if (!t || t.leaving) return;
		this.items = this.items.map((x) => (x.id === id ? { ...x, leaving: true } : x));
		setTimeout(() => this.remove(id), TOAST_EXIT_MS);
	}
	/** Drop a toast at once, skipping the exit. */
	remove(id: number) {
		this.#disarm(id);
		this.#commits.get(id)?.();
		this.items = this.items.filter((t) => t.id !== id);
	}
	/** Run a toast's action once: the toast stays (button loading) until run settles, then dismisses. */
	async act(id: number) {
		const t = this.items.find((x) => x.id === id);
		if (!t?.action || t.pending) return;
		this.#disarm(id);
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
