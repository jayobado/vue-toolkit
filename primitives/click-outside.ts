import { onScopeDispose } from 'vue'
import type { Ref } from 'vue'

export function useClickOutside(
	target: Ref<HTMLElement | null | undefined>,
	handler: () => void,
	ignore?: (Ref<HTMLElement | null | undefined> | string)[],
): () => void {
	let shouldFire = false

	function isIgnored(e: Event): boolean {
		if (!ignore) return false
		return ignore.some(item => {
			if (typeof item === 'string') {
				return Array.from(document.querySelectorAll(item))
					.some(el => el === e.target || e.composedPath().includes(el))
			}
			const el = item.value
			return el != null && (el === e.target || e.composedPath().includes(el))
		})
	}

	function onPointerDown(e: PointerEvent): void {
		const el = target.value
		if (!el) { shouldFire = false; return }
		if (isIgnored(e)) { shouldFire = false; return }
		shouldFire = !e.composedPath().includes(el)
	}

	function onClick(e: Event): void {
		if (!shouldFire) return
		shouldFire = false
		const el = target.value
		if (!el) return
		if (e.composedPath().includes(el)) return
		if (isIgnored(e)) return
		handler()
	}

	document.addEventListener('pointerdown', onPointerDown, { capture: true })
	document.addEventListener('click', onClick, { passive: true, capture: true })

	const dispose = () => {
		document.removeEventListener('pointerdown', onPointerDown, true)
		document.removeEventListener('click', onClick, true)
	}

	try { onScopeDispose(dispose) } catch { /* standalone */ }
	return dispose
}