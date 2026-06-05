export interface File {
	id: string
	name: string
	file_path: string
	content_type: string
	size: number
	created_at: Date
}

export interface ChatMessage {
	id: string
	role: 'user' | 'assistant'
	content: string
	created_at: Date
}
