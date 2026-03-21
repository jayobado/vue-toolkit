import {
	createVNode,
	defineComponent,
	markRaw,
	shallowRef,
	type FunctionalComponent,
	type SetupContext,
	type VNode,
	type PropType,
	type Component,
	type VNodeProps,
	type VNodeArrayChildren,
} from 'vue'

// ─── Prop schema types ────────────────────────────────────────────────────────

type PropDescriptor<T> =
	| { type: PropType<T>; required: true; default?: never }
	| { type: PropType<T>; required?: false; default: T }
	| { type: PropType<T>; required?: false; default?: undefined }

type PropsSchema<P extends Record<string, unknown>> = {
	[K in keyof P]: PropDescriptor<P[K]>
}

type InferProps<S extends PropsSchema<Record<string, unknown>>> = {
	[K in keyof S]: S[K] extends PropDescriptor<infer T> ? T : never
}

type RequiredKeys<S> = {
	[K in keyof S]: S[K] extends { required: true } ? K : never
}[keyof S]

type OptionalKeys<S> = Exclude<keyof S, RequiredKeys<S>>

export type NormalizedProps<S extends PropsSchema<Record<string, unknown>>> = {
	[K in RequiredKeys<S>]: S[K] extends PropDescriptor<infer T> ? T : never
} & {
	[K in OptionalKeys<S>]?: S[K] extends PropDescriptor<infer T> ? T : never
}

// ─── Internal types ───────────────────────────────────────────────────────────

type RawSetup = (
	props: Record<string, unknown>,
	ctx: SetupContext
) => () => VNode | null

// ─── defineFn ─────────────────────────────────────────────────────────────────

export function defineFn<S extends PropsSchema<Record<string, unknown>>>(config: {
	name?: string
	props: S
	render: (
		props: NormalizedProps<S>,
		ctx: Omit<SetupContext, 'expose'>
	) => VNode | null
}): FunctionalComponent<NormalizedProps<S>> {
	const component: FunctionalComponent<NormalizedProps<S>> = (props, ctx) =>
		config.render(props, ctx) ?? createVNode('span')

	// Object.assign sidesteps the FunctionalComponent.props type constraint.
	// Type safety is enforced by PropsSchema<S> at the call site — by the time
	// we assign to the component Vue only needs the runtime descriptor shape.
	Object.assign(component, {
		props: Object.fromEntries(
			Object.entries(config.props).map(([k, v]) => [k, v])
		),
		displayName: config.name,
	})

	return markRaw(component)
}

// ─── defineTS ─────────────────────────────────────────────────────────────────

export function defineTS<S extends PropsSchema<Record<string, unknown>>>(config: {
	name: string
	props: S
	setup: (
		props: Readonly<InferProps<S>>,
		ctx: SetupContext
	) => () => VNode | null
}): Component {
	// Build the options object as unknown first so TypeScript does not
	// try to match our PropsSchema against defineComponent's overloads.
	const options: unknown = {
		name: config.name,
		props: Object.fromEntries(
			Object.entries(config.props).map(([k, v]) => [k, v])
		),
		setup: config.setup as RawSetup,
	}

	return markRaw(
		defineComponent(options as Parameters<typeof defineComponent>[0])
	)
}

// ─── withMemo ─────────────────────────────────────────────────────────────────

interface MemoVNode extends VNode {
	_memo?: unknown[]
}

export function withMemo<T extends MemoVNode>(
	deps: unknown[],
	render: () => T,
	cache: (T | undefined)[],
	index: number,
): T {
	const cached = cache[index]
	if (cached && isMemoSame(cached, deps)) return cached
	const ret = render()
	ret._memo = deps
	cache[index] = ret
	return ret
}

function isMemoSame(cached: MemoVNode, deps: unknown[]): boolean {
	const memo = cached._memo
	if (!memo || memo.length !== deps.length) return false
	for (let i = 0; i < deps.length; i++) {
		if (deps[i] !== memo[i]) return false
	}
	return true
}

export function createMemoCache(size: number): (MemoVNode | undefined)[] {
	return markRaw(new Array<MemoVNode | undefined>(size).fill(undefined))
}

// ─── h() ──────────────────────────────────────────────────────────────────────

type ExtractComponentProps<C> =
	C extends FunctionalComponent<infer P, Record<PropertyKey, never>>
	? P
	: C extends abstract new (...args: unknown[]) => { $props: infer P }
	? P
	: C extends { new(...args: unknown[]): { $props: infer P } }
	? P
	: C extends { __props: infer P }
	? P
	: Record<string, unknown>

type NormalisedChildren =
	| string
	| VNode
	| VNode[]
	| VNodeArrayChildren
	| Record<string, () => VNode | VNode[] | null>
	| null

function normaliseChildren(
	children:
		| VNode
		| VNode[]
		| Record<string, () => VNode | VNode[] | null>
		| string
		| null
		| undefined
): NormalisedChildren {
	if (children == null) return null
	if (typeof children === 'string') return children
	if (Array.isArray(children)) return children
	if ('type' in (children as object)) return [children as VNode]
	return children as Record<string, () => VNode | VNode[] | null>
}

export function h<C>(
	component: C,
	props?: (ExtractComponentProps<C> & VNodeProps) | null,
	children?:
		| VNode
		| VNode[]
		| Record<string, () => VNode | VNode[] | null>
		| string
		| null,
): VNode {
	return createVNode(
		component as Parameters<typeof createVNode>[0],
		props ?? null,
		normaliseChildren(children)
	)
}

export { shallowRef, markRaw, createVNode }