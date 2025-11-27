import React from "react";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-gray-700 mb-2">{children}</h2>;
}

export function CardValue({ children }: { children: React.ReactNode }) {
  return <div className="text-2xl font-bold text-gray-900">{children}</div>;
}
