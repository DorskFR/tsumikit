/**
 * `showModal()` focuses inside the dialog and scrolls it to reveal that
 * element, which still sits at its off-screen starting translate. The scroll
 * cancels the slide-in, so undo it before the first paint.
 */
export function showModalUnscrolled(dialog: HTMLDialogElement) {
	dialog.showModal();
	pinScroll(dialog);
}

export function pinScroll(dialog: HTMLElement) {
	dialog.scrollTop = 0;
	dialog.scrollLeft = 0;
}
