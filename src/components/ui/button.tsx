"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-[0.95rem] font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-gold text-ink hover:bg-gold-soft",
        outline:
          "border border-steel text-paper hover:border-gold hover:text-gold-text",
        ghost: "text-paper-dim hover:text-paper",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    // Inside a form, a submit button locks while the form is sending, so a
    // second tap can't save the same thing twice.
    const { pending } = useFormStatus();
    const locks = !asChild && props.type !== "button" && props.type !== "reset";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || (locks && pending)}
        aria-busy={locks && pending ? true : undefined}
        {...props}
      >
        {locks && pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
