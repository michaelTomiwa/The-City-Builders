import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-sm border border-steel bg-dusk px-4 text-paper placeholder:text-paper-dim/60 focus:border-gold",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
