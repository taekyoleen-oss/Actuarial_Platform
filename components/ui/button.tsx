import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Tesla: 그림자 없음, radius 4px, weight 500, 색상 트랜지션만(globals.css의 * 규칙)
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-[#3457c4]",
        secondary:
          "bg-white text-foreground border border-border hover:border-foreground",
        ghost: "bg-transparent text-tertiary hover:text-foreground",
        danger: "bg-white text-[#c4302b] border border-border hover:border-[#c4302b]",
      },
      size: {
        md: "h-10 px-5",
        sm: "h-8 px-3",
        lg: "h-12 px-7 text-[16px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
