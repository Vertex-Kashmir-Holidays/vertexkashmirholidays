// src/components/itinerary/EditableField.tsx
"use client";

import { useState, useRef, useEffect, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface EditableFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onValueChange?: (value: string) => void;
  className?: string;
  rows?: number;
}

export function EditableField({ 
  value, 
  onValueChange, 
  className, 
  rows = 1, 
  ...props 
}: EditableFieldProps) {
  const [internalValue, setInternalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onValueChange?.(newValue);
    autoResize();
  };

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    autoResize();
  }, [internalValue]);

  return (
    <textarea
      ref={textareaRef}
      value={internalValue}
      onChange={handleChange}
      rows={rows}
      className={cn(
        "w-full rounded-md bg-transparent px-1 outline-none transition-all focus:bg-muted/30 focus:ring-1 focus:ring-primary/30",
        "print:bg-transparent print:p-0 print:focus:ring-0", // Print optimization
        className
      )}
      {...props}
    />
  );
}