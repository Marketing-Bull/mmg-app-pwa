"use client";

import * as Label from "@radix-ui/react-label";
import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const controlClasses =
  "w-full rounded-2xl border border-[var(--line-strong)] bg-paper px-4 py-3 text-espresso placeholder:text-muted/55 transition-colors focus:border-red focus:outline-none";

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label.Root
        htmlFor={id}
        className="flex items-baseline gap-1.5 text-[0.78rem] font-semibold tracking-[0.02em] text-espresso"
      >
        {label}
        {required ? (
          <span aria-hidden className="text-red">
            *
          </span>
        ) : (
          <span className="text-[0.7rem] font-normal text-muted">optional</span>
        )}
      </Label.Root>
      {children}
      {error ? (
        <p className="text-[0.75rem] font-medium text-red">{error}</p>
      ) : hint ? (
        <p className="text-[0.75rem] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, className, id, required, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required}>
      <input
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(controlClasses, error && "border-red", className)}
        {...props}
      />
    </FieldShell>
  );
});

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField({ label, hint, error, className, id, required, ...props }, ref) {
    const generated = useId();
    const fieldId = id ?? generated;
    return (
      <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required}>
        <textarea
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          className={cn(controlClasses, "min-h-[6.5rem] resize-y", error && "border-red", className)}
          {...props}
        />
      </FieldShell>
    );
  },
);
