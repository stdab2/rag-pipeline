import { useState, useEffect } from 'react'
import { Trash2, FileText, Search, RefreshCw, Loader2, CheckCircle } from 'lucide-react'
import { cn, formatBytes, formatDate, toDate } from '@/lib/utils'
import type { File } from '@/types'
import { ButtonDanger } from '@/components/ButtonDanger'
import { SortIcon } from '@/components/SortIcon'

// ── Sort helpers ─────────────────────────────────────────────────────────────
type SortKey = 'name' | 'size' | 'uploadedAt'

function sortFiles(files: File[], key: SortKey, asc: boolean) {
	return [...files].sort((a, b) => {
		let cmp = 0
		if (key === 'name') cmp = a.name.localeCompare(b.name)
		if (key === 'size') cmp = a.size - b.size
		if (key === 'uploadedAt')
			cmp = toDate(a.created_at).getTime() - toDate(b.created_at).getTime()
		return asc ? cmp : -cmp
	})
}

export function FilesPage() {
	const [files, setFiles] = useState<File[]>([])
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [search, setSearch] = useState<string>('')
	const [sortKey, setSortKey] = useState<SortKey>('uploadedAt')
	const [sortAsc, setSortAsc] = useState<boolean>(false)
	const [reindex, setReindex] = useState<Set<string>>(new Set())
	const [confirmReindex, setConfirmReindex] = useState<Set<string>>(new Set())

	useEffect(() => {
		const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

		const fetchFiles = async () => {
			const endpoint = `${apiBaseUrl}/files`
			try {
				const response = await fetch(endpoint)
				if (!response.ok) {
					throw new Error(`Error fetching files: ${response.statusText}`)
				}
				const data: File[] = await response.json()
				setFiles(data)
			} catch (error) {
				console.error('Failed to fetch files:', error)
			}
		}

		fetchFiles()
	}, [])

	const filtered = sortFiles(
		files.filter((file) => file.name.toLowerCase().includes(search.toLowerCase())),
		sortKey,
		sortAsc
	)

	const allSelected = filtered.length > 0 && filtered.every((f) => selected.has(f.id))

	const toggleAll = () => {
		if (allSelected) setSelected(new Set())
		else setSelected(new Set(filtered.map((f) => f.id)))
	}

	const toggleOne = (id: string) => {
		const next = new Set(selected)
		if (next.has(id)) next.delete(id)
		else next.add(id)
		setSelected(next)
	}

	const deleteSelectedFiles = async (file_ids: Set<string>) => {
		const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
		const endpoint = `${apiBaseUrl}/files`
		try {
			const response = await fetch(endpoint, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					file_ids: [...file_ids]
				}),
			})
			if (!response.ok) {
				throw new Error(`Error deleting files: ${response.statusText}`)
			}
			setFiles((prev) => prev.filter((f) => !file_ids.has(f.id)))
			setSelected((prev) => {
				const newSet = new Set(prev)
				for (const element of file_ids) {
					newSet.delete(element)
				}
				return newSet
			})
		} catch (error) {
			console.error('Failed to delete files:', error)
		}
	}

	const reindexFile = async (id: string) => {
		setReindex((prev) => {
			const newSet = new Set(prev)
			newSet.add(id)
			return newSet
		})

		const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
		const endpoint = `${apiBaseUrl}/files/${id}/reindex`

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
			})
			if (!response.ok) {
				throw new Error(`Error reindexing file: ${response.statusText}`)
			}
			setConfirmReindex((prev) => {
				const newSet = new Set(prev)
				newSet.add(id)
				return newSet
			})

			setTimeout(() => {
				setConfirmReindex((prev) => {
					const newSet = new Set(prev)
					prev.delete(id)
					return newSet
				})

				setReindex((prev) => {
					const newSet = new Set(prev)
					prev.delete(id)
					return newSet
				})
			}, 5000)

		} catch (error) {
			console.error('Failed to delete files:', error)
		}
	}










	const handleSort = (key: SortKey) => {
		if (sortKey == key) setSortAsc((a) => !a)
		else {
			setSortKey(key)
			setSortAsc(true)
		}
	}

	const thCls =
		'aws-label px-4 py-2.5 text-left cursor-pointer select-none hover:text-aws-text whitespace-nowrap flex items-center gap-1'

	return (
		<div className="px-6 py-8 max-w-6xl mx-auto w-full">
			{/* Page header */}
			<div className="flex items-start justify-between mb-6">
				<div>
					<h1 className="text-xl font-semibold text-aws-text">File Manager</h1>
					<p className="text-sm text-aws-muted mt-1">
						{files.length} documents in knowledge base
					</p>
				</div>
				{selected.size > 0 && (
					<ButtonDanger
						onClick={() => deleteSelectedFiles(selected)}
						buttonText={`Delete ${selected.size} selected`}
						icon={<Trash2 size={14} />}
					/>
				)}
			</div>

			<div className="aws-panel overflow-hidden">
				{/* Toolbar */}
				<div className="flex items-center gap-3 px-4 py-2.5 bg-aws-bg border-b border-aws-border">
					<div className="relative flex-1 max-w-sm">
						<Search
							size={13}
							className="absolute left-2.5 top-1/2 -translate-y-1/2 text-aws-muted"
						/>
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search files…"
							className="w-full pl-8 pr-3 py-1.5 text-sm border border-aws-border rounded bg-white
									text-aws-text placeholder:text-aws-muted
									focus:outline-none focus:border-aws-blue focus:ring-1 focus:ring-aws-blue"
						/>
					</div>
					<span className="text-xs text-aws-muted ml-auto">
						{filtered.length} result{filtered.length !== 1 ? 's' : ''}
					</span>
				</div>

				{/* Table */}
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="border-b border-aws-border bg-aws-bg">
							<tr>
								<th className="px-4 py-2.5 w-10">
									<input
										type="checkbox"
										checked={allSelected}
										onChange={toggleAll}
										className="accent-aws-blue"
									/>
								</th>
								<th className="px-0">
									<button className={thCls} onClick={() => handleSort('name')}>
										Name
										<SortIcon
											actualSortKey={sortKey}
											sortAsc={sortAsc}
											k="name"
										/>
									</button>
								</th>
								<th className="px-0">
									<button className={thCls} onClick={() => handleSort('size')}>
										Size
										<SortIcon
											actualSortKey={sortKey}
											sortAsc={sortAsc}
											k="size"
										/>
									</button>
								</th>
								<th className="aws-label px-4 py-2.5 text-left">Type</th>
								<th className="px-0">
									<button
										className={thCls}
										onClick={() => handleSort('uploadedAt')}
									>
										Uploaded
										<SortIcon
											actualSortKey={sortKey}
											sortAsc={sortAsc}
											k="uploadedAt"
										/>
									</button>
								</th>
								<th className="aws-label px-4 py-2.5 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-aws-border">
							{filtered.length === 0 && (
								<tr>
									<td
										colSpan={7}
										className="px-4 py-10 text-center text-sm text-aws-muted"
									>
										No files found.
									</td>
								</tr>
							)}
							{filtered.map((f) => (
								<tr
									key={f.id}
									className={cn(
										'transition-colors duration-75',
										selected.has(f.id) ? 'bg-aws-blue-light' : 'hover:bg-aws-bg'
									)}
								>
									<td className="px-4 py-3 w-10">
										<input
											type="checkbox"
											checked={selected.has(f.id)}
											onChange={() => toggleOne(f.id)}
											className="accent-aws-blue"
										/>
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<FileText
												size={14}
												className="text-aws-muted shrink-0"
											/>
											<span className="text-aws-text font-medium">
												{f.name}
											</span>
										</div>
									</td>
									<td className="px-4 py-3 text-aws-muted whitespace-nowrap">
										{formatBytes(f.size)}
									</td>
									<td className="px-4 py-3 font-mono text-xs text-aws-muted">
										{f.content_type}
									</td>
									<td className="px-4 py-3 text-aws-muted whitespace-nowrap">
										{formatDate(f.created_at)}
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center justify-end gap-2">
											<button
												onClick={() => reindexFile(f.id)}
												title="Re-index"
												disabled={reindex.has(f.id)}
												className="text-aws-muted hover:text-aws-blue transition-colors"
											>
												{!reindex.has(f.id) && !confirmReindex.has(f.id) && <RefreshCw size={14} />}
												{reindex.has(f.id) && !confirmReindex.has(f.id) && <Loader2 color="#ff9900" size={14} className="animate-spin" />}
												{reindex.has(f.id) && confirmReindex.has(f.id) && <CheckCircle color="green" size={14} />}
											</button>
											<button
												onClick={() => deleteSelectedFiles(new Set([f.id]))}
												title="Delete"
												className="text-aws-muted hover:text-status-error transition-colors"
											>
												<Trash2 size={14} />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
