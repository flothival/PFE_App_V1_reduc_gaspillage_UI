import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full min-w-0 rounded-md transition-[color,background,box-shadow] outline-none " +
    "font-montpellier selection:bg-primary selection:text-primary-foreground " +
    "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground " +
    "placeholder:text-muted-foreground placeholder:uppercase placeholder:font-light " +
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 " +
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 " +
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        // Compact — par défaut, pour les filtres, tableaux, inputs inline.
        default:
          "h-9 px-3 py-1 text-sm bg-transparent border border-input shadow-xs dark:bg-input/30",
        // Grand — pour les forms principaux (login, création), signature MMM.
        lg: "h-[52px] px-5 py-1 text-base font-medium bg-muted hover:bg-primary/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type InputProps = React.ComponentProps<"input"> &
  VariantProps<typeof inputVariants>;

function Input({ className, type, variant, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant ?? "default"}
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Input, inputVariants };
