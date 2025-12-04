import React from "react";

type DivProps = React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>;

export function Card({ children, className, ...rest }: DivProps) {
  const combinedClassName = className
    ? `bg-white border border-gray-200 rounded-xl shadow-sm ${className}`
    : "bg-white border border-gray-200 rounded-xl shadow-sm";

  return (
    <div className={combinedClassName} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...rest }: DivProps) {
  const combinedClassName = className
    ? `px-4 py-3 border-b border-gray-100 ${className}`
    : "px-4 py-3 border-b border-gray-100";

  return (
    <div className={combinedClassName} {...rest}>
      {children}
    </div>
  );
}

export function CardBody({ children, className, ...rest }: DivProps) {
  const combinedClassName = className ? `px-4 py-3 ${className}` : "px-4 py-3";

  return (
    <div className={combinedClassName} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...rest }: DivProps) {
  const combinedClassName = className
    ? `px-4 py-3 border-t border-gray-100 ${className}`
    : "px-4 py-3 border-t border-gray-100";

  return (
    <div className={combinedClassName} {...rest}>
      {children}
    </div>
  );
}

type HeadingProps = React.PropsWithChildren<React.HTMLAttributes<HTMLHeadingElement>>;

export function CardTitle({ children, className, ...rest }: HeadingProps) {
  const combinedClassName = className
    ? `text-sm font-semibold text-gray-700 ${className}`
    : "text-sm font-semibold text-gray-700";

  return (
    <h2 className={combinedClassName} {...rest}>
      {children}
    </h2>
  );
}

type ParagraphProps = React.PropsWithChildren<React.HTMLAttributes<HTMLParagraphElement>>;

export function CardValue({ children, className, ...rest }: ParagraphProps) {
  const combinedClassName = className
    ? `text-2xl font-bold text-gray-900 ${className}`
    : "text-2xl font-bold text-gray-900";

  return (
    <p className={combinedClassName} {...rest}>
      {children}
    </p>
  );
}
