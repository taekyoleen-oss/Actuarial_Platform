import * as React from "react";
import { cn } from "@/lib/utils";

// 카드 표면: 화이트 + 소프트 엘리베이션(--shadow-card). 커버형은 rounded-cover + overflow-hidden.
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-cover bg-white shadow-card", className)}
      {...props}
    />
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("py-4", className)} {...props} />;
}
