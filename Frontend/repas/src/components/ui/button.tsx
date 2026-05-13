import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { motion, useAnimation } from "framer-motion";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 overflow-hidden cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        dark: "bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80",
        success: "bg-success text-success-foreground hover:bg-success-dark",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        accent: "bg-accent text-accent-foreground shadow-sm hover:bg-accent/80",
      },
      size: {
        default: "h-9 px-4 py-2",
        xs: "h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3",
        lg: "h-10 rounded-md px-8",
        xl: "h-[52px] rounded-md px-6 text-base has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/** Background utilisé par le slideEffect, par variante. Toujours plus foncé
 *  que le variant nominal pour donner l'impression d'un "remplissage" qui
 *  vient de la gauche au hover. */
const slideBackgrounds: Record<string, string> = {
  default: "bg-primary-dark",
  dark: "bg-neutral-800 dark:bg-neutral-200",
  success: "bg-success-dark",
  destructive: "bg-destructive-dark",
  secondary: "bg-secondary/60",
  outline: "bg-accent/60 dark:bg-accent/30",
  ghost: "bg-accent/30 dark:bg-accent/20",
  link: "bg-primary/30",
  accent: "bg-accent/60",
};

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Active l'animation signature MMM : une couche plus sombre slide
     *  depuis la gauche au survol. Ignoré si `asChild` est `true`
     *  (Slot.Root impose un enfant unique). */
    slideEffect?: boolean;
  };

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  slideEffect = false,
  children,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  const controls = useAnimation();
  const activeSlideEffect = slideEffect && !asChild;

  const handleMouseEnter: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (activeSlideEffect) {
      void controls.start({
        x: 0,
        opacity: 1,
        transition: { duration: 0.4, ease: "easeInOut" },
      });
    }
    onMouseEnter?.(e);
  };

  const handleMouseLeave: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (activeSlideEffect) {
      void controls.start({
        x: "-100%",
        opacity: 1,
        transition: { duration: 0.4, ease: "easeInOut" },
      });
    }
    onMouseLeave?.(e);
  };

  // asChild impose un enfant unique à Slot.Root → on simplifie le markup
  // dans ce cas (pas de slideEffect possible, pas de wrapper supplémentaire).
  if (asChild) {
    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {activeSlideEffect ? (
        <>
          <motion.span
            aria-hidden
            className={cn(
              "absolute inset-0 z-0",
              slideBackgrounds[variant ?? "default"],
            )}
            initial={{ x: "-100%", opacity: 1 }}
            animate={controls}
          />
          <span className="relative z-10 inline-flex items-center gap-2">
            {children}
          </span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
