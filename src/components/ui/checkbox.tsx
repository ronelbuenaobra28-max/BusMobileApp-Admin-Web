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
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        checked && "bg-primary text-primary-foreground",
        className,
      )}
      onClick={() => onCheckedChange?.(!checked)}
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
        <span className="flex items-center justify-center text-current">
          <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6l3 3 5-5" />
          </svg>
        </span>
      )}
    </button>
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
