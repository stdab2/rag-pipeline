import { cn } from '@/lib/utils'

interface ButtonDangerProps {
	onClick?: () => void
	buttonText?: string
	icon?: React.ReactNode
	className?: string
}

const awsStyleButtonDanger =
	'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium\
                                bg-white text-status-error border border-status-error rounded\
                                hover:bg-status-error-bg\
                                transition-colors duration-100 cursor-pointer select-none'

export function ButtonDanger({ onClick, buttonText, icon, className }: ButtonDangerProps) {
	return (
		<button className={cn(awsStyleButtonDanger, className)} onClick={onClick}>
			{icon}
			{buttonText}
		</button>
	)
}
