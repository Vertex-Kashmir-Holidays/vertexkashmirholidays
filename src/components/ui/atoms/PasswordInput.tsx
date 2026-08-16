"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <input ref={ref} type={visible ? "text" : "password"} className={cn("pr-10", className)} {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition hover:text-foreground"
        >
          {visible ? <Eye className="h-4 w-4" strokeWidth={2} /> : <EyeOff className="h-4 w-4" strokeWidth={2} />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
