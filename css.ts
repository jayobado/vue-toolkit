// css.ts
// Isomorphic CSS-in-JS engine — no framework dependency.
// Works standalone in any TypeScript project.
// Use collectStyles() + resetStyles() for SSR,
// or just css() / staticCss() for client-only apps.

type CSSValue = string | number

export interface StyleProperties {
  display?: string; flexDirection?: string; flexWrap?: string; flex?: CSSValue
  flexGrow?: CSSValue; flexShrink?: CSSValue; flexBasis?: CSSValue
  alignItems?: string; alignSelf?: string; justifyContent?: string
  justifySelf?: string; gap?: CSSValue; rowGap?: CSSValue; columnGap?: CSSValue
  gridTemplateColumns?: CSSValue; gridTemplateRows?: CSSValue
  gridColumn?: CSSValue; gridRow?: CSSValue; gridArea?: CSSValue
  width?: CSSValue; minWidth?: CSSValue; maxWidth?: CSSValue
  height?: CSSValue; minHeight?: CSSValue; maxHeight?: CSSValue
  padding?: CSSValue; paddingTop?: CSSValue; paddingRight?: CSSValue
  paddingBottom?: CSSValue; paddingLeft?: CSSValue; paddingInline?: CSSValue
  paddingBlock?: CSSValue; margin?: CSSValue; marginTop?: CSSValue
  marginRight?: CSSValue; marginBottom?: CSSValue; marginLeft?: CSSValue
  marginInline?: CSSValue; marginBlock?: CSSValue
  position?: string; top?: CSSValue; right?: CSSValue; bottom?: CSSValue
  left?: CSSValue; zIndex?: CSSValue; inset?: CSSValue
  fontSize?: CSSValue; fontWeight?: CSSValue; fontFamily?: CSSValue
  fontStyle?: string; lineHeight?: CSSValue; letterSpacing?: CSSValue
  textAlign?: string; textDecoration?: CSSValue; textTransform?: string
  textOverflow?: string; whiteSpace?: string; color?: CSSValue
  background?: CSSValue; backgroundColor?: CSSValue; backgroundImage?: CSSValue
  border?: CSSValue; borderTop?: CSSValue; borderRight?: CSSValue
  borderBottom?: CSSValue; borderLeft?: CSSValue; borderRadius?: CSSValue
  borderColor?: CSSValue; borderWidth?: CSSValue; borderStyle?: string
  outline?: CSSValue; outlineOffset?: CSSValue
  boxShadow?: CSSValue; opacity?: CSSValue; overflow?: string
  overflowX?: string; overflowY?: string; cursor?: CSSValue
  pointerEvents?: string; userSelect?: string; visibility?: string
  transform?: CSSValue; transformOrigin?: CSSValue; transition?: CSSValue
  animation?: CSSValue; filter?: CSSValue; backdropFilter?: CSSValue
  willChange?: CSSValue; clipPath?: CSSValue; appearance?: CSSValue
  resize?: string; listStyle?: CSSValue; objectFit?: string
  verticalAlign?: CSSValue; content?: CSSValue; boxSizing?: string
  aspectRatio?: CSSValue; wordBreak?: string
}

export interface StyleObject extends StyleProperties {
  pseudo?: Record<string, StyleProperties>
  media?:  Record<string, StyleProperties>
}

// ─── Engine internals ─────────────────────────────────────────────────────────
// Plain Maps — no Vue dependency, no markRaw needed.
// These are module-level singletons that never enter Vue's reactivity system.

const IS_SERVER   = typeof document === 'undefined'
const ruleCache   = new Map<string, string>()  // canonical key → class name
const serverRules = new Map<string, string>()  // class name → CSS rule (server only)
const clientInjected = new Set<string>()       // class names injected into DOM

let styleEl: HTMLStyleElement | null = null
let counter = 0

function kebab(s: string): string {
  return s.replace(/([A-Z])/g, '-$1').toLowerCase()
}

const unitless = new Set([
  'animationIterationCount', 'columnCount', 'flexGrow', 'flexShrink',
  'fontWeight', 'gridColumn', 'gridRow', 'lineHeight', 'opacity',
  'order', 'zIndex',
])

function val(prop: string, v: CSSValue): string {
  return typeof v === 'number' && v !== 0 && !unitless.has(prop)
    ? `${v}px`
    : String(v)
}

function genCls(): string {
  return `_${(counter++).toString(36)}`
}

function injectClient(cls: string, rule: string): void {
  if (clientInjected.has(cls)) return
  clientInjected.add(cls)
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = '__vts__'
    document.head.appendChild(styleEl)
  }
  try {
    styleEl.sheet!.insertRule(rule, styleEl.sheet!.cssRules.length)
  } catch { /* skip invalid rules */ }
}

function registerRule(key: string, cls: string, rule: string): void {
  ruleCache.set(key, cls)
  if (IS_SERVER) {
    serverRules.set(cls, rule)
  } else {
    injectClient(cls, rule)
  }
}

function processProps(
  props:        StyleProperties,
  makeSelector: (cls: string) => string,
  keyPrefix:    string,
  classes:      string[],
): void {
  for (const [prop, value] of Object.entries(props)) {
    if (value == null) continue
    const key = `${keyPrefix}:${prop}:${value}`
    if (!ruleCache.has(key)) {
      const cls  = genCls()
      const decl = `${kebab(prop)}:${val(prop, value as CSSValue)}`
      const rule = `${makeSelector(cls)}{${decl};}`
      registerRule(key, cls, rule)
    }
    classes.push(ruleCache.get(key)!)
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function css(style: StyleObject): string {
  const classes: string[] = []
  const { pseudo, media, ...base } = style

  processProps(base as StyleProperties, cls => `.${cls}`, 'b', classes)

  if (pseudo) {
    for (const [sel, props] of Object.entries(pseudo)) {
      if (!props) continue
      processProps(props, cls => `.${cls}${sel}`, `p:${sel}`, classes)
    }
  }

  if (media) {
    for (const [query, props] of Object.entries(media)) {
      if (!props) continue
      processProps(props, cls => `@media ${query}{.${cls}`, `m:${query}`, classes)
      if (classes.length > 0) {
        const lastCls = classes[classes.length - 1]
        if (IS_SERVER) {
          const existing = serverRules.get(lastCls)
          if (existing && !existing.endsWith('}}')) {
            serverRules.set(lastCls, existing + '}')
          }
        }
      }
    }
  }

  return classes.join(' ')
}

export function staticCss(style: StyleObject): string {
  return css(style)
}

export function collectStyles(): string {
  if (!IS_SERVER) return ''
  const rules = [...serverRules.values()].join('\n')
  return `<style id="__vts__">${rules}</style>`
}

export function resetStyles(): void {
  if (!IS_SERVER) return
  serverRules.clear()
}

export function snapshotCounter(): number       { return counter }
export function restoreCounter(n: number): void  { counter = n }