import type { HTMLAttributes, ReactNode } from "react";
import "./ui.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  action?: ReactNode;
}

export function Card({ children, title, action, className = "", ...props }: CardProps) {
  return (
    <section className={`ui-card ${className}`.trim()} {...props}>
      {title || action ? (
        <header className="ui-card__header">
          {title ? <h2>{title}</h2> : <span />}
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}
