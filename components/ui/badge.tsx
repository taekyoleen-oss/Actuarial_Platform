import * as React from "react";
import { cn } from "@/lib/utils";

// 모노크롬 라벨 (카테고리 등). 세만틱 색상 없음.
export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-tertiary bg-surface",
        className
      )}
      {...props}
    />
  );
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded bg-surface", className)}
      {...props}
    />
  );
}
