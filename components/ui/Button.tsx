import * as React from "react"

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
export type ButtonSize = "sm" | "md" | "lg"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant
	size?: ButtonSize
	fullWidth?: boolean
}

const Button = ({
	variant = "primary",
	size = "md",
	fullWidth = false,
	className,
	children,
	...props
}: ButtonProps) => {
	const combinedClassName = [
		"btn",
		`btn--${variant}`,
		`btn--${size}`,
		fullWidth ? "btn--fullWidth" : "",
		className ?? "",
	]
		.filter(Boolean)
		.join(" ")

	return (
		<button {...props} className={combinedClassName}>
			{children}
		</button>
	)
}

export default Button
