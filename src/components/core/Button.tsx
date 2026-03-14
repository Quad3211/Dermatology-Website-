import React, { forwardRef } from "react";
import { cn } from "../../utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          {
            "bg-primary-600 text-white hover:bg-primary-700":
              variant === "primary",
            "bg-surface-muted text-slate-900 hover:bg-slate-200":
              variant === "secondary",
            "border border-surface-border bg-transparent hover:bg-surface-muted text-slate-700":
              variant === "outline",
            "bg-status-danger text-white hover:bg-red-600":
              variant === "danger",
            "bg-transparent hover:bg-primary-50 text-primary-600":
              variant === "ghost",
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 py-2": size === "md",
            "h-12 px-8 text-lg": size === "lg",
          },
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-white" />
        ) : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
