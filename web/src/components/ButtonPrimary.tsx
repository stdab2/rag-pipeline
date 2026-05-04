import { cn } from '@/lib/utils'

interface ButtonPrimaryProps {
	onClick?: () => void
	buttonText?: string
	icon?: React.ReactNode
	className?: string
}

const awsStyleButtonPrimary =
	'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium\
                            bg-aws-blue text-white border border-aws-blue rounded\
                            hover:bg-aws-blue-hover active:bg-aws-blue-hover\
                            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aws-blue\
                            transition-colors duration-100 cursor-pointer select-none'

export function ButtonPrimary({ onClick, buttonText, icon, className }: ButtonPrimaryProps) {
	return (
		<button className={cn(awsStyleButtonPrimary, className)} onClick={onClick}>
			{icon}
			{buttonText}
		</button>
	)
}
