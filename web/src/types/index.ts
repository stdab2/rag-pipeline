export type FileStatus = 'pending' | 'processing' | 'indexed' | 'error'

export interface ManagedFile {
	id: string
	name: string
	size: number
	type: string
	uploadedAt: Date
	status: FileStatus
	errorMessage?: string
}

export interface ChatMessage {
	id: string
	role: 'user' | 'assistant'
	content: string
	timestamp: Date
	sourceFiles?: string[]
}
