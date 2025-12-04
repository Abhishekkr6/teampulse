import React from "react";

type Radius = "none" | "sm" | "md" | "lg" | "xl" | "full";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
	lines?: number;
	radius?: Radius;
	inline?: boolean;
	lineClassName?: string;
}

const radiusClasses: Record<Radius, string> = {
	none: "",
	sm: "rounded-sm",
	md: "rounded-md",
	lg: "rounded-lg",
	xl: "rounded-xl",
	full: "rounded-full",
};

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
	{ lines = 1, radius = "md", inline = false, className = "", lineClassName = "h-3 w-full", ...rest },
	ref,
) {
	const baseSkeletonClass = `animate-pulse bg-gray-200 ${radiusClasses[radius]}`;

	if (lines <= 1) {
		return <div ref={ref} className={`${baseSkeletonClass} ${className}`} {...rest} />;
	}

	const containerClassName = inline ? className : `flex flex-col space-y-2 ${className}`;

	return (
		<div ref={ref} className={containerClassName.trim()} {...rest}>
			{/* Render stacked skeleton rows when multiple lines are requested. */}
			{Array.from({ length: lines }).map((_, index) => (
				<div key={index} className={`${baseSkeletonClass} ${lineClassName}`} />
			))}
		</div>
	);
});

Skeleton.displayName = "Skeleton";

