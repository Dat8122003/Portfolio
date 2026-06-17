import type { ReactNode } from "react";

type Variant = "primary" | "solid" | "ghost" | "outline";

type Props = {
  href?: string;
  children: ReactNode;
  variant?: Variant;
  fallback?: ReactNode;
  className?: string;
};

const base =
  "btn-magnetic inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors";

const variants: Record<Variant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:text-white dark:hover:bg-indigo-400",
  solid:
    "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-white",
  ghost:
    "border hairline bg-white text-zinc-900 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white dark:bg-zinc-950 dark:text-zinc-50 dark:hover:border-zinc-50 dark:hover:bg-zinc-50 dark:hover:text-zinc-900",
  outline:
    "border hairline bg-white text-zinc-900 hover:border-zinc-900 hover:bg-white hover:text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:border-zinc-50 dark:hover:bg-zinc-950 dark:hover:text-zinc-50",
};

const disabled =
  "border hairline bg-white text-zinc-400 dark:bg-zinc-950 dark:text-zinc-500 cursor-not-allowed pointer-events-none";

const Button = ({
  href,
  children,
  variant = "ghost",
  fallback,
  className = "",
}: Props) => {
  const isDisabled = !href;
  return (
    <a
      href={href ?? "#"}
      target={href ? "_blank" : undefined}
      rel="noreferrer"
      aria-disabled={isDisabled || undefined}
      onClick={(e) => {
        if (isDisabled) e.preventDefault();
      }}
      className={`${base} ${isDisabled ? disabled : variants[variant]} ${className}`}
    >
      {isDisabled ? (fallback ?? children) : children}
      <span aria-hidden>↗</span>
    </a>
  );
};

export default Button;