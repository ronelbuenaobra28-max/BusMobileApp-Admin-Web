import * as React from "react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    indeterminate?: boolean;
  }
>(({ className, checked, onCheckedChange, indeterminate, ...props }, ref) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate ?? false;
    }
  }, [indeterminate]);

  return (
    <button
      ref={ref}
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      data-slot="checkbox"
      type="button"
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-slate-300 bg-white transition-colors",
        "hover:border-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-slate-900 data-[state=checked]:bg-slate-900 data-[state=checked]:text-white",
        "data-[state=indeterminate]:border-slate-900 data-[state=indeterminate]:bg-slate-900",
        className,
      )}
      data-state={indeterminate ? "indeterminate" : checked ? "checked" : "unchecked"}
      {...props}
    >
      <input
        ref={inputRef}
        type="checkbox"
        className="sr-only"
        checked={!!checked}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
      />
      {checked && (
        <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6l3 3 5-5" />
        </svg>
      )}
      {indeterminate && (
        <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M2 6h8" />
        </svg>
      )}
    </button>
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
