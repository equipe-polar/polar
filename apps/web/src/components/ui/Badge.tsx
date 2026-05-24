import type { ReactNode } from "react";
import "./ui.css";

type BadgeTone = "default" | "success" | "warning" | "danger" | "info";

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={`ui-badge ui-badge--${tone}`}>{children}</span>;
}
