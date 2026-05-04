import { NavLink } from 'react-router-dom'
import { Database, Upload, Files, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
	{ to: '/upload', icon: Upload, label: 'Upload' },
	{ to: '/files', icon: Files, label: 'File Manager' },
	{ to: '/chat', icon: MessageSquare, label: 'Q&A' },
]

export function TopNav() {
	return (
		<header className="bg-aws-nav text-white shrink-0 z-40">
			{/* Top bar */}
			<div className="flex items-center h-12 px-4 gap-4 border-b border-white/10">
				<div className="flex items-center gap-2 mr-6">
					<Database size={18} className="text-aws-orange" />
					<span className="font-semibold text-sm tracking-wide">RAG Pipeline</span>
				</div>

				<nav className="flex items-stretch h-full gap-0.5">
					{navItems.map(({ to, label, icon: Icon }) => (
						<NavLink
							key={to}
							to={to}
							className={({ isActive }) =>
								cn(
									'flex items-center gap-1.5 px-3 text-sm border-b-2 transition-colors duration-100 h-full',
									isActive
										? 'border-aws-orange text-white'
										: 'border-transparent text-white/70 hover:text-white hover:bg-aws-nav-hover'
								)
							}
						>
							<Icon size={14} />
							{label}
						</NavLink>
					))}
				</nav>

				<div className="ml-auto flex items-center gap-3 text-xs text-white/50">
					<span>Console</span>
					<span className="w-px h-3 bg-white/20" />
					<span>Help</span>
				</div>
			</div>
		</header>
	)
}
