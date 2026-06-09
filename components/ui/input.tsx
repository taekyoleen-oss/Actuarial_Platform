import * as React from "react";
import { cn } from "@/lib/utils";

// Tesla: 투명/최소 테두리, placeholder #8E8E8E (globals.css)
const base =
  "w-full rounded border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-placeholder focus-visible:outline-none focus-visible:border-foreground";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(base, "h-10", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(base, "py-2 min-h-24", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(base, "h-10 appearance-none pr-8 cursor-pointer", className)}
    {...props}
  />
));
Select.displayName = "Select";
