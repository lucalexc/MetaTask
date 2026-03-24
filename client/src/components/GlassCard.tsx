import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export function GlassCard({ children, className, gradient = false, ...props }: GlassCardProps) {
  return (
    <div
      className={twMerge(
        "bg-white rounded-xl border border-gray-200 shadow-sm p-6 transition-all duration-200 ease-out",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
