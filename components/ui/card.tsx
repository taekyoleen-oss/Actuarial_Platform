import * as React from "react";
import { cn } from "@/lib/utils";

// Tesla: 그림자·테두리 없는 클린 화이트 표면. 커버형은 rounded-cover + overflow-hidden.
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-background", className)} {...props} />;
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("py-4", className)} {...props} />;
}
