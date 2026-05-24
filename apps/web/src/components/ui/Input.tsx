import type { InputHTMLAttributes } from "react";
import "./ui.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, id, error, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className={`ui-field ${className}`.trim()} htmlFor={inputId}>
      <span>{label}</span>
      <input id={inputId} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} {...props} />
      {error ? (
        <small className="ui-field__error" id={`${inputId}-error`}>
          {error}
        </small>
      ) : null}
    </label>
  );
}
