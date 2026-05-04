import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { UploadPage } from '@/pages/UploadPage'
import { FilesPage } from '@/pages/FilesPage'
import { ChatPage } from '@/pages/ChatPage'

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<Navigate to="/upload" />} />
					<Route path="upload" element={<UploadPage />} />
					<Route path="files" element={<FilesPage />} />
					<Route path="chat" element={<ChatPage />} />
				</Route>
			</Routes>
		</BrowserRouter>
	)
}

export default App
