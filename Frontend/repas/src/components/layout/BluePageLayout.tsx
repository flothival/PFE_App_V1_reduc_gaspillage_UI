import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BluePageLayoutProps = {
  children: ReactNode;
  className?: string;
};


export function BluePageLayout({ children, className }: BluePageLayoutProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col overflow-hidden bg-white",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "#0356F2" }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to top right, #4FDCB9 -20%, rgba(79, 220, 185, 0) 67.26%)",
          }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: "url(/images/cantine-duotone.png)" }}
        />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
