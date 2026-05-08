import { useState } from 'react'
import { Trash2, RefreshCw, FileText, Search, AlertCircle, Loader2 } from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'
import type { ManagedFile, FileStatus } from '@/types'
import { ButtonDanger } from '@/components/ButtonDanger'
import { formatDate } from '@/lib/utils'
import { SortIcon } from '@/components/SortIcon'

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_FILES: ManagedFile[] = [
	{
		id: '1',
		name: 'product-manual.pdf',
		size: 2_400_000,
		type: 'application/pdf',
		uploadedAt: new Date('2026-04-01T10:00:00'),
		status: 'indexed',
	},
	{
		id: '2',
		name: 'faq-dataset.csv',
		size: 145_000,
		type: 'text/csv',
		uploadedAt: new Date('2026-04-02T14:22:00'),
		status: 'indexed',
	},
	{
		id: '3',
		name: 'legal-terms.docx',
		size: 980_000,
		type: 'application/docx',
		uploadedAt: new Date('2026-04-03T09:15:00'),
		status: 'processing',
	},
	{
		id: '4',
		name: 'release-notes.md',
		size: 34_000,
		type: 'text/markdown',
		uploadedAt: new Date('2026-04-04T16:40:00'),
		status: 'error',
		errorMessage: 'Embedding service timeout',
	},
	{
		id: '5',
		name: 'knowledge-base-v2.txt',
		size: 5_100_000,
		type: 'text/plain',
		uploadedAt: new Date('2026-04-05T08:00:00'),
		status: 'indexed',
	},
	{
		id: '6',
		name: 'onboarding-guide.pdf',
		size: 1_200_000,
		type: 'application/pdf',
		uploadedAt: new Date('2026-04-06T11:33:00'),
		status: 'pending',
	},
]

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, error }: { status: FileStatus; error?: string }) {
	const map: Record<FileStatus, { label: string; cls: string; icon?: React.ReactNode }> = {
		indexed: { label: 'Indexed', cls: 'text-status-indexed bg-status-indexed-bg' },
		processing: {
			label: 'Processing',
			cls: 'text-status-processing bg-status-processing-bg',
			icon: <Loader2 size={10} className="animate-spin" />,
		},
		error: {
			label: 'Error',
			cls: 'text-status-error bg-status-error-bg',
			icon: <AlertCircle size={10} />,
		},
		pending: { label: 'Pending', cls: 'text-status-pending bg-status-pending-bg' },
	}
	const { label, cls, icon } = map[status]
	return (
		<span title={error} className={cn('status-badge', cls)}>
			{icon}
			{label}
		</span>
	)
}

// ── Sort helpers ─────────────────────────────────────────────────────────────
type SortKey = 'name' | 'size' | 'uploadedAt' | 'status'

function sortFiles(files: ManagedFile[], key: SortKey, asc: boolean) {
	return [...files].sort((a, b) => {
		let cmp = 0
		if (key === 'name') cmp = a.name.localeCompare(b.name)
		if (key === 'size') cmp = a.size - b.size
		if (key === 'uploadedAt') cmp = a.uploadedAt.getTime() - b.uploadedAt.getTime()
		if (key === 'status') cmp = a.status.localeCompare(b.status)
		return asc ? cmp : -cmp
	})
}

export function FilesPage() {
	const [files, setFiles] = useState<ManagedFile[]>(MOCK_FILES)
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [search, setSearch] = useState<string>('')
	const [sortKey, setSortKey] = useState<SortKey>('uploadedAt')
	const [sortAsc, setSortAsc] = useState<boolean>(false)

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

	// should call backend
	const deleteSelected = () => {
		setFiles((prev) => prev.filter((f) => !selected.has(f.id)))
		setSelected(new Set())
	}

	// should call backend
	const reindexFile = (id: string) => {
		setFiles((prev) =>
			prev.map((f) =>
				f.id === id ? { ...f, status: 'processing', errorMessage: undefined! } : f
			)
		)
		setTimeout(() => {
			setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'indexed' } : f)))
		}, 2500)
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
						onClick={deleteSelected}
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
										Name{' '}
										<SortIcon
											actualSortKey={sortKey}
											sortAsc={sortAsc}
											k="name"
										/>
									</button>
								</th>
								<th className="px-0">
									<button className={thCls} onClick={() => handleSort('size')}>
										Size{' '}
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
										Uploaded{' '}
										<SortIcon
											actualSortKey={sortKey}
											sortAsc={sortAsc}
											k="uploadedAt"
										/>
									</button>
								</th>
								<th className="px-0">
									<button className={thCls} onClick={() => handleSort('status')}>
										Status{' '}
										<SortIcon
											actualSortKey={sortKey}
											sortAsc={sortAsc}
											k="status"
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
										{f.errorMessage && (
											<p className="text-xs text-status-error mt-0.5 ml-5">
												{f.errorMessage}
											</p>
										)}
									</td>
									<td className="px-4 py-3 text-aws-muted whitespace-nowrap">
										{formatBytes(f.size)}
									</td>
									<td className="px-4 py-3 font-mono text-xs text-aws-muted">
										{f.type}
									</td>
									<td className="px-4 py-3 text-aws-muted whitespace-nowrap">
										{formatDate(f.uploadedAt)}
									</td>
									<td className="px-4 py-3">
										<StatusBadge status={f.status} error={f.errorMessage!} />
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center justify-end gap-2">
											<button
												onClick={() => reindexFile(f.id)}
												title="Re-index"
												className="text-aws-muted hover:text-aws-blue transition-colors"
											>
												<RefreshCw size={14} />
											</button>
											<button
												onClick={() => {
													setFiles((p) => p.filter((x) => x.id !== f.id))
													setSelected((s) => {
														const n = new Set(s)
														n.delete(f.id)
														return n
													})
												}}
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
