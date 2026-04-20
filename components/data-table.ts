import { createVNode, type VNode, type VNodeArrayChildren } from 'vue'

export interface Column<T> {
	key: string
	header: string
	render?: (row: T, index: number) => VNode | string
	headerClass?: string
	cellClass?: string
}

export interface DataTableProps<T> {
	columns: Column<T>[]
	rows: T[]
	class?: string
	headerClass?: string
	rowClass?: string | ((row: T, index: number) => string)
	emptyText?: string
	rowKey?: (row: T, index: number) => string | number
	onRowClick?: (row: T, index: number) => void
}

export function dataTable<T extends Record<string, unknown>>(
	props: DataTableProps<T>,
): VNode {
	const { columns, rows, emptyText = 'No data' } = props

	const headerCells: VNodeArrayChildren = columns.map(col => {
		return createVNode('th', {
			class: col.headerClass || undefined,
		}, col.header)
	})

	const thead = createVNode('thead', null, [
		createVNode('tr', {
			class: props.headerClass || undefined,
		}, headerCells),
	])

	let bodyContent: VNodeArrayChildren

	if (rows.length === 0) {
		bodyContent = [
			createVNode('tr', null, [
				createVNode('td', { colSpan: columns.length }, emptyText),
			]),
		]
	} else {
		bodyContent = rows.map((row, index) => {
			const cells: VNodeArrayChildren = columns.map(col => {
				const content = col.render
					? col.render(row, index)
					: String(row[col.key] ?? '')
				return createVNode('td', {
					class: col.cellClass || undefined,
				}, typeof content === 'string' ? content : [content])
			})

			const rowClass = typeof props.rowClass === 'function'
				? props.rowClass(row, index)
				: props.rowClass

			return createVNode('tr', {
				key: props.rowKey ? props.rowKey(row, index) : index,
				class: rowClass || undefined,
				onClick: props.onRowClick ? () => props.onRowClick!(row, index) : undefined,
				style: props.onRowClick ? 'cursor: pointer' : undefined,
			}, cells)
		})
	}

	const tbody = createVNode('tbody', null, bodyContent)

	return createVNode('table', {
		class: props.class || undefined,
	}, [thead, tbody])
}