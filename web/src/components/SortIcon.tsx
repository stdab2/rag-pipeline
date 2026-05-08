import { ChevronUp, ChevronDown } from 'lucide-react'

interface SortIconProps {
	actualSortKey: string
	sortAsc: boolean
	k: string
}

export function SortIcon({ actualSortKey, sortAsc, k }: SortIconProps) {
	return (
		<>
			{k == actualSortKey ? (
				sortAsc ? (
					<ChevronUp size={12} />
				) : (
					<ChevronDown size={12} />
				)
			) : (
				<span className="w-3" />
			)}
		</>
	)
}
