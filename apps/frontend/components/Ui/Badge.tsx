import React from "react";

type BadgeType = "default" | "success" | "warning" | "danger" | "info";

export function Badge({
  children,
  type = "default",
}: {
  children: React.ReactNode;
  type?: BadgeType;
}) {
  const variants: Record<BadgeType, string> = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-indigo-100 text-indigo-700",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${variants[type]}`}>
      {children}
    </span>
  );
}
