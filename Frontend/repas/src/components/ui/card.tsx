import * as React from "react";

import { cn } from "@/lib/utils";

type CardProps = React.ComponentProps<"div"> & {
  /** Affiche une carte fantôme translatée +4px/+4px derrière, à 60% d'opacité.
   *  Effet "stacking" signature MMM (visible sur le login scora). */
  doubleEffect?: boolean;
};

function Card({
  className,
  doubleEffect = false,
  children,
  ...props
}: CardProps) {
  const baseClasses =
    "flex flex-col gap-6 rounded-lg bg-card py-6 text-card-foreground shadow-sm";

  if (!doubleEffect) {
    return (
      <div data-slot="card" className={cn(baseClasses, className)} {...props}>
        {children}
      </div>
    );
  }

  // Wrapper avec pr-4 pb-4 pour réserver la place où le fantôme dépasse.
  return (
    <div className="relative flex h-full w-fit pr-4 pb-4">
      <div
        data-slot="card"
        className={cn(baseClasses, "relative h-full w-full grow", className)}
        {...props}
      >
        <div
          aria-hidden
          className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-lg bg-card/60"
        />
        {children}
      </div>
    </div>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "leading-none font-semibold text-2xl font-montpellier",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm font-light text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
