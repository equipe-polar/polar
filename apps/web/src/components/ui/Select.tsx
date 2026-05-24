import type { SelectHTMLAttributes } from "react";
import "./ui.css";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ label: string; value: string }>;
  error?: string;
}

export function Select({ label, id, options, error, className = "", ...props }: SelectProps) {
  const selectId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className={`ui-field ${className}`.trim()} htmlFor={selectId}>
      <span>{label}</span>
      <select id={selectId} aria-invalid={Boolean(error)} aria-describedby={error ? `${selectId}-error` : undefined} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <small className="ui-field__error" id={`${selectId}-error`}>
          {error}
        </small>
      ) : null}
    </label>
  );
}
