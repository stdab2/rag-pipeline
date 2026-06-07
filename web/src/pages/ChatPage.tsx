import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { Send, FileText, CheckSquare, Square, Bot, User, Loader2, ChevronRight } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { File, ChatMessage } from '@/types'
import ReactMarkdown from 'react-markdown'

// ── Mock data ────────────────────────────────────────────────────────────────
const EXAMPLE_QUESTIONS = [
	'What authentication methods are supported?',
	'What are the rate limits for the API?',
	'How do I reset my API key?',
]

const CHAT_ID = '74e0ddc7-0dc7-4cfc-96b2-7abaa2ea112c'

function generateTemporaryId() {
	return Math.random().toString(36).slice(2)
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
	const isUser = msg.role === 'user'
	return (
		<div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
			<div
				className={cn(
					'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
					isUser
						? 'bg-aws-blue text-white'
						: 'bg-aws-bg border border-aws-border text-aws-muted'
				)}
			>
				{isUser ? <User size={13} /> : <Bot size={13} />}
			</div>
			<div className={cn('max-w-[75%]', isUser && 'items-end flex flex-col')}>
				<div
					className={cn(
						'rounded px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
						isUser
							? 'bg-aws-blue text-white rounded-tr-none'
							: 'bg-white border border-aws-border text-aws-text rounded-tl-none'
					)}
				>
					<ReactMarkdown>{msg.content}</ReactMarkdown>
					{/*msg.content.split('\n').map((line, i) => (
						<span key={i}>
							{line}
							{i < msg.content.split('\n').length - 1 && <br />}
						</span>
					))*/}
				</div>
				<span className="text-[11px] text-aws-muted mt-1 px-0.5">
					{formatDate(msg.created_at)}
				</span>
			</div>
		</div>
	)
}

export function ChatPage() {
	const [files, setFiles] = useState<File[]>([])
	const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [input, setInput] = useState('')
	const [loading, setLoading] = useState(false)
	const [sidebarOpen, setSidebarOpen] = useState(true)
	const bottomRef = useRef<HTMLDivElement>(null)

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
				setSelectedFiles(new Set(data.slice(0, 1).map((f) => f.id)))
			} catch (error) {
				console.error('Failed to fetch files:', error)
			}
		}

		const fetchMessages = async () => {
			const endpoint = `${apiBaseUrl}/chat/${CHAT_ID}/messages`
			try {
				const response = await fetch(endpoint)
				if (!response.ok) {
					throw new Error(`Error fetching messages: ${response.statusText}`)
				}
				const data: ChatMessage[] = await response.json()
				setMessages(data)
			} catch (error) {
				console.error('Failed to fetch messages:', error)
			}
		}

		fetchFiles()
		fetchMessages()
	}, [])

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages, loading])

	const toggleFile = (id: string) => {
		setSelectedFiles((prev) => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}

	const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			sendMessage()
		}
	}

	const canSend = input.trim().length > 0 && selectedFiles.size > 0 && !loading

	const sendMessage = async () => {
		const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
		const endpoint = `${apiBaseUrl}/chat/message`

		if (!input.trim() || loading) return
		const userMsg: ChatMessage = {
			id: generateTemporaryId(),
			role: 'user',
			content: input.trim(),
			created_at: new Date().toISOString(),
		}
		setMessages((prev) => [...prev, userMsg])
		setInput('')
		setLoading(true)

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chat_id: CHAT_ID,
					content: input.trim(),
					role: 'user',
					file_ids: Array.from(selectedFiles),
				}),
			})

			if (!response.ok) {
				throw new Error(`Error sending message: ${response.statusText}`)
			}
			const data: { user_message: ChatMessage; ai_response: ChatMessage } =
				await response.json()
			const user_message: ChatMessage = data.user_message
			const ai_response: ChatMessage = data.ai_response

			setMessages((prev) => [...prev.slice(0, -1), user_message, ai_response])
			setLoading(false)
		} catch (error) {
			console.error('Failed to send message:', error)
		}
	}

	return (
		<div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>
			{/* ── File sidebar ──────────────────────────────────────────────────── */}
			<aside
				className={cn(
					'border-r border-aws-border bg-white flex flex-col shrink-0 transition-all duration-200',
					sidebarOpen ? 'w-64' : 'w-10'
				)}
			>
				<button
					onClick={() => setSidebarOpen((o) => !o)}
					className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-aws-border text-aws-muted hover:bg-aws-bg transition-colors w-full"
				>
					{sidebarOpen && <span className="aws-label">Context files</span>}
					<ChevronRight
						size={14}
						className={cn(
							'transition-transform duration-200 shrink-0',
							sidebarOpen && 'rotate-180'
						)}
					/>
				</button>

				{sidebarOpen && (
					<>
						<div className="flex-1 overflow-y-auto">
							{files.length === 0 ? (
								<p className="text-xs text-aws-muted p-4">No files available.</p>
							) : (
								<ul className="divide-y divide-aws-border">
									{files.map((file) => {
										const active = selectedFiles.has(file.id)
										return (
											<li key={file.id}>
												<button
													onClick={() => toggleFile(file.id)}
													className={cn(
														'w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-aws-bg',
														active && 'bg-aws-blue-light'
													)}
												>
													{active ? (
														<CheckSquare
															size={14}
															className="text-aws-blue mt-0.5 shrink-0"
														/>
													) : (
														<Square
															size={14}
															className="text-aws-muted mt-0.5 shrink-0"
														/>
													)}
													<div className="min-w-0">
														<p
															className={cn(
																'text-xs font-medium truncate',
																active
																	? 'text-aws-blue'
																	: 'text-aws-text'
															)}
														>
															{file.name}
														</p>
														<p className="text-[11px] text-aws-muted mt-0.5 font-mono">
															{file.content_type.split('/')[1]}
														</p>
													</div>
												</button>
											</li>
										)
									})}
								</ul>
							)}
						</div>

						<div className="px-3 py-2.5 border-t border-aws-border bg-aws-bg">
							<p className="text-xs text-aws-muted">
								<span className="font-medium text-aws-text">
									{selectedFiles.size}
								</span>{' '}
								of {files.length} selected
							</p>
						</div>
					</>
				)}
			</aside>

			{/* ── Chat panel ────────────────────────────────────────────────────── */}
			<div className="flex flex-col flex-1 min-w-0">
				{/* Context indicator */}
				{selectedFiles.size === 0 && (
					<div className="px-4 py-2 bg-status-processing-bg border-b border-aws-border text-xs text-status-processing flex items-center gap-1.5">
						<FileText size={12} />
						Select at least one file from the sidebar to enable Q&A.
					</div>
				)}

				{/* Messages area */}
				<div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
					{messages.length === 0 && !loading && (
						<div className="h-full flex flex-col items-center justify-center text-center gap-3 py-16">
							<div className="w-12 h-12 rounded-full bg-aws-bg border border-aws-border flex items-center justify-center">
								<Bot size={20} className="text-aws-muted" />
							</div>
							<div>
								<p className="text-sm font-medium text-aws-text">Ask a question</p>
								<p className="text-xs text-aws-muted mt-1 max-w-xs">
									Select context files from the sidebar, then type your question
									below. Responses are grounded in the selected documents.
								</p>
							</div>
							<div className="aws-panel p-3 text-left max-w-sm w-full mt-2">
								<p className="aws-label mb-2">Example questions</p>
								{EXAMPLE_QUESTIONS.map((question) => (
									<button
										key={question}
										onClick={() => setInput(question)}
										className="w-full text-left text-xs text-aws-blue hover:underline py-1 flex items-center gap-1.5"
									>
										<ChevronRight size={11} />
										{question}
									</button>
								))}
							</div>
						</div>
					)}

					{messages.map((msg) => (
						<MessageBubble key={msg.id} msg={msg} />
					))}

					{loading && (
						<div className="flex gap-3">
							<div className="w-7 h-7 rounded-full bg-aws-bg border border-aws-border flex items-center justify-center shrink-0 mt-0.5">
								<Bot size={13} className="text-aws-muted" />
							</div>
							<div className="bg-white border border-aws-border rounded rounded-tl-none px-3.5 py-2.5 shadow-sm">
								<Loader2 size={14} className="text-aws-blue animate-spin" />
							</div>
						</div>
					)}

					<div ref={bottomRef} />
				</div>

				{/* Input area */}
				<div className="border-t border-aws-border bg-white px-4 py-3">
					{selectedFiles.size > 0 && (
						<div className="flex flex-wrap gap-1 mb-2">
							{files
								.filter((file) => selectedFiles.has(file.id))
								.map((file) => (
									<span
										key={file.id}
										className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded
                                             bg-aws-blue-light text-aws-blue border border-aws-blue/20"
									>
										<FileText size={9} />
										{file.name}
									</span>
								))}
						</div>
					)}
					<div className="flex items-end gap-2">
						<textarea
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={onKeyDown}
							placeholder={
								selectedFiles.size === 0
									? 'Select files first…'
									: 'Ask a question… (Enter to send, Shift+Enter for newline)'
							}
							disabled={selectedFiles.size === 0 || loading}
							rows={1}
							style={{ resize: 'none', minHeight: '38px', maxHeight: '120px' }}
							className="flex-1 px-3 py-2 text-sm border border-aws-border rounded bg-white
                         text-aws-text placeholder:text-aws-muted
                         focus:outline-none focus:border-aws-blue focus:ring-1 focus:ring-aws-blue
                         disabled:opacity-50 disabled:cursor-not-allowed
                         overflow-y-auto"
							onInput={(e) => {
								const t = e.currentTarget
								t.style.height = 'auto'
								t.style.height = Math.min(t.scrollHeight, 120) + 'px'
							}}
						/>
						<button
							onClick={sendMessage}
							disabled={!canSend}
							className={cn(
								'aws-btn-primary h-[38px] px-3',
								!canSend && 'opacity-40 cursor-not-allowed'
							)}
						>
							<Send size={14} />
						</button>
					</div>
					<p className="text-[11px] text-aws-muted mt-1.5">
						Responses are generated from selected documents only — not from general
						knowledge.
					</p>
				</div>
			</div>
		</div>
	)
}
