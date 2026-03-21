import { createVNode, type VNode, type VNodeArrayChildren } from 'vue'

type Child = VNode | string | number | null | undefined | false
type Children = Child | Child[] | VNodeArrayChildren

export interface ElProps {
	[key: string]: unknown 
	class?: string; id?: string; style?: string; role?: string
	tabIndex?: number; title?: string; key?: string | number
	'aria-label'?: string; 'aria-hidden'?: boolean | 'true' | 'false'
	'aria-expanded'?: boolean; 'aria-live'?: string
	onClick?: (e: MouseEvent) => void
	onDblclick?: (e: MouseEvent) => void
	onMouseenter?: (e: MouseEvent) => void
	onMouseleave?: (e: MouseEvent) => void
	onFocus?: (e: FocusEvent) => void
	onBlur?: (e: FocusEvent) => void
	onKeydown?: (e: KeyboardEvent) => void
	onKeyup?: (e: KeyboardEvent) => void
	onInput?: (e: Event) => void
	onChange?: (e: Event) => void
	onSubmit?: (e: Event) => void
}

export interface InputElProps extends ElProps {
	type?: string; value?: string; placeholder?: string; disabled?: boolean
	readonly?: boolean; required?: boolean; name?: string
	autocomplete?: string; autofocus?: boolean; min?: string; max?: string
}

export interface ButtonElProps extends ElProps {
	type?: 'button' | 'submit' | 'reset'; disabled?: boolean
}

export interface AnchorElProps extends ElProps {
	href?: string; target?: string; rel?: string
}

const _h = (tag: string) =>
	(props?: ElProps | null, children?: Children): VNode =>
		createVNode(tag, props ?? null, children ?? null)

// Layout
export const div = _h('div')
export const section = _h('section')
export const article = _h('article')
export const aside = _h('aside')
export const header = _h('header')
export const footer = _h('footer')
export const main = _h('main')
export const nav = _h('nav')

// Text
export const span = _h('span')
export const p = _h('p')
export const h1 = _h('h1')
export const h2 = _h('h2')
export const h3 = _h('h3')
export const h4 = _h('h4')
export const h5 = _h('h5')
export const h6 = _h('h6')
export const em = _h('em')
export const strong = _h('strong')
export const small = _h('small')
export const code = _h('code')
export const pre = _h('pre')

// Lists
export const ul = _h('ul')
export const ol = _h('ol')
export const li = _h('li')

// Form
export const form = (
	props?: (ElProps & { action?: string; method?: string; enctype?: string }) | null,
	children?: Children
): VNode => createVNode('form', props ?? null, children ?? null)

export const fieldset = _h('fieldset')

export const label = (
	props?: (ElProps & { for?: string }) | null,
	children?: Children
): VNode => createVNode('label', props ?? null, children ?? null)

export const input = (props?: InputElProps | null): VNode =>
	createVNode('input', props ?? null)

export const button = (props?: ButtonElProps | null, children?: Children): VNode =>
	createVNode('button', props ?? null, children ?? null)

export const select = _h('select')

export const textarea = (
	props?: (ElProps & { rows?: number; placeholder?: string }) | null
): VNode => createVNode('textarea', props ?? null)

export const option = (
	props?: (ElProps & { value?: string; selected?: boolean }) | null,
	children?: Children
): VNode => createVNode('option', props ?? null, children ?? null)

// Media / navigation
export const img = (
	props?: (ElProps & { src?: string; alt?: string; loading?: string }) | null
): VNode => createVNode('img', props ?? null)

export const a = (props?: AnchorElProps | null, children?: Children): VNode =>
	createVNode('a', props ?? null, children ?? null)

export const hr = (props?: ElProps | null): VNode =>
	createVNode('hr', props ?? null)

export const br = (): VNode => createVNode('br', null)

// Table
export const table = _h('table')
export const thead = _h('thead')
export const tbody = _h('tbody')
export const tr = _h('tr')

export const th = (
	props?: (ElProps & { scope?: string; colSpan?: number }) | null,
	children?: Children
): VNode => createVNode('th', props ?? null, children ?? null)

export const td = (
	props?: (ElProps & { colSpan?: number }) | null,
	children?: Children
): VNode => createVNode('td', props ?? null, children ?? null)