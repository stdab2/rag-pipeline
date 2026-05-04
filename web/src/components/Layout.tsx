import { Outlet } from 'react-router-dom'
import { TopNav } from '@/components/TopNav'

export function Layout() {
	return (
		<div className="flex flex-col min-h-screen bg-aws-bg font-sans">
			<TopNav />
			<main className="flex-1 flex flex-col">
				<Outlet />
			</main>
		</div>
	)
}
