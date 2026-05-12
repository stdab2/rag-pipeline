import { useState, useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'
import { ButtonPrimary } from '@/components/ButtonPrimary'

interface UploadFile {
	id: string
	file: File
	progress: number
	status: 'queued' | 'uploading' | 'done' | 'error'
	error?: string
}

const ACCEPTED_TYPES = ['.pdf', '.txt', '.md', '.docx', '.csv', '.json']
const MAX_SIZE_MB = 50

function generateId() {
	return Math.random().toString(36).slice(2)
}

export function UploadPage() {
	const [files, setFiles] = useState<UploadFile[]>([])
	const [dragActive, setDragActive] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	const addFiles = (files: File[]) => {
		const valid = files.filter((file) => {
			const ext = '.' + file.name.split('.').pop()?.toLowerCase()
			return ACCEPTED_TYPES.includes(ext) && file.size <= MAX_SIZE_MB * 1024 * 1024
		})
		const newFiles: UploadFile[] = valid.map((file) => ({
			id: generateId(),
			file,
			progress: 0,
			status: 'queued',
		}))
		setFiles((prev) => [...prev, ...newFiles])
	}

	const uploadFile = (file: UploadFile, onProgress: (p: number) => void, onDone: () => void) => {
		const formData = new FormData()
		formData.append('file', file.file)

		const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
		const endpoint = `${apiBaseUrl}/files/uploadfile`

		fetch(endpoint, { method: 'POST', body: formData }).then((res) => {
			const reader = res.body!.getReader()
			const decoder = new TextDecoder()

			const read = () =>
				reader.read().then(({ done, value }) => {
					if (done) return onDone()
					const text = decoder.decode(value)
					const match = text.match(/data: (.+)/)
					if (match) {
						const { progress } = JSON.parse(match[1]!)
						onProgress(progress)
					}
					read()
				})

			read()
		})
	}

	const startUpload = () => {
		setFiles((prev) =>
			prev.map((file) => (file.status === 'queued' ? { ...file, status: 'uploading' } : file))
		)

		files
			.filter((file) => file.status === 'queued')
			.forEach((file) => {
				uploadFile(
					file,
					(p) =>
						setFiles((prev) =>
							prev.map((x) => (x.id === file.id ? { ...x, progress: p } : x))
						),
					() =>
						setFiles((prev) =>
							prev.map((x) =>
								x.id === file.id ? { ...x, status: 'done', progress: 100 } : x
							)
						)
				)
			})
	}

	const removeFile = (id: string) => setFiles((prev) => prev.filter((x) => x.id !== id))

	const onDrop = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		setDragActive(false)
		addFiles(Array.from(e.dataTransfer.files))
	}

	const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) addFiles(Array.from(e.target.files))
	}

	const queued = files.filter((f) => f.status === 'queued').length

	return (
		<div className="max-w-3xl mx-auto w-full px-6 py-8">
			{/* Page header */}
			<div className="mb-6">
				<h1 className="text-xl font-semibold text-aws-text">Upload Documents</h1>
				<p className="text-sm text-aws-muted mt-1">
					Add files to your knowledge base for indexing and retrieval.
				</p>
			</div>

			{/* Drop zone */}
			<div
				role="button"
				tabIndex={0}
				onDragOver={(e) => {
					e.preventDefault()
					setDragActive(true)
				}}
				onDragLeave={() => setDragActive(false)}
				onDrop={onDrop}
				onClick={() => inputRef.current?.click()}
				onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
				className={cn(
					'aws-panel flex flex-col items-center justify-center gap-3 py-14 px-8 cursor-pointer',
					'border-2 border-dashed transition-colors duration-150 rounded',
					dragActive
						? 'border-aws-blue bg-aws-blue-light'
						: 'border-aws-border hover:border-aws-border-dark hover:bg-aws-bg'
				)}
			>
				<div
					className={cn(
						'w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-150',
						dragActive ? 'bg-aws-blue text-white' : 'bg-aws-bg text-aws-muted'
					)}
				>
					<Upload size={22} />
				</div>
				<div className="text-center">
					<p className="text-sm font-medium text-aws-text">
						{dragActive ? 'Drop files here' : 'Drag and drop files, or '}
						{!dragActive && (
							<span className="text-aws-blue hover:underline">browse</span>
						)}
					</p>
					<p className="text-xs text-aws-muted mt-1">
						Accepted: {ACCEPTED_TYPES.join(', ')} · Max {MAX_SIZE_MB} MB per file
					</p>
				</div>
				<input
					ref={inputRef}
					type="file"
					multiple
					accept={ACCEPTED_TYPES.join(',')}
					onChange={onInputChange}
					className="hidden"
				/>
			</div>

			{/* File queue */}
			{files.length > 0 && (
				<div className="mt-4 aws-panel overflow-hidden">
					<div className="flex items-center justify-between px-4 py-2.5 border-b border-aws-border bg-aws-bg">
						<span className="text-xs font-medium text-aws-muted uppercase tracking-wide">
							Files ({files.length})
						</span>
						{queued > 0 && (
							<ButtonPrimary
								className="text-xs py-1"
								onClick={startUpload}
								buttonText={`Upload ${queued} file${queued !== 1 ? 's' : ''}`}
								icon={<Upload size={13} />}
							/>
						)}
					</div>

					<ul className="divide-y divide-aws-border">
						{files.map((f) => (
							<li key={f.id} className="flex items-center gap-3 px-4 py-3">
								<FileText size={16} className="text-aws-muted shrink-0" />

								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-2">
										<span className="text-sm truncate text-aws-text">
											{f.file.name}
										</span>
										<span className="text-xs text-aws-muted shrink-0">
											{formatBytes(f.file.size)}
										</span>
									</div>

									{f.status === 'uploading' && (
										<div className="mt-1.5 h-1 bg-aws-border rounded-full overflow-hidden">
											<div
												className="h-full bg-aws-blue transition-all duration-150 rounded-full"
												style={{ width: `${f.progress}%` }}
											/>
										</div>
									)}

									{f.status === 'queued' && (
										<span className="text-xs text-aws-muted">Queued</span>
									)}
								</div>

								<div className="shrink-0">
									{f.status === 'done' && (
										<CheckCircle2 size={16} className="text-status-indexed" />
									)}
									{f.status === 'error' && (
										<AlertCircle size={16} className="text-status-error" />
									)}
									{f.status === 'uploading' && (
										<Loader2 size={16} className="text-aws-blue animate-spin" />
									)}
									{f.status === 'queued' && (
										<button
											onClick={(e) => {
												e.stopPropagation()
												removeFile(f.id)
											}}
											className="text-aws-muted hover:text-status-error transition-colors"
										>
											<X size={15} />
										</button>
									)}
								</div>
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Constraints info box */}
			<div className="mt-6 aws-panel p-4 bg-aws-blue-light border-aws-blue/30">
				<p className="aws-label text-aws-blue mb-2">Supported formats</p>
				<div className="grid grid-cols-3 gap-x-6 gap-y-1 text-xs text-aws-muted">
					<span>.pdf — PDF documents</span>
					<span>.txt — Plain text</span>
					<span>.md — Markdown</span>
					<span>.docx — Word documents</span>
					<span>.csv — Spreadsheets</span>
					<span>.json — JSON data</span>
				</div>
				<p className="text-xs text-aws-muted mt-3">
					Maximum file size: <strong className="text-aws-text">{MAX_SIZE_MB} MB</strong>.
					Files are chunked and embedded automatically after upload.
				</p>
			</div>
		</div>
	)
}
